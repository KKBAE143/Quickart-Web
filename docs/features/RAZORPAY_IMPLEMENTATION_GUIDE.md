# Razorpay Implementation Guide (Next.js Ready) 🚀

This guide explains how Razorpay is implemented in Quickart (backend + React frontend) with the exact business rules (₹99 minimum order, delivery slot required, partial prepayment for COD) and code references so you can reuse it in a new Quickart **Next.js** site.

---

## 🔑 Core Rules

- ₹99 minimum order enforced before any payment flow.  
- Delivery address **and** delivery slot/date are mandatory.  
- Online payment flow: Razorpay order → client checkout → server-side signature verification → order creation.  
- Partial prepayment COD flow: customer pays ₹20–₹100 online (10% capped) and pays the rest as COD; tracked on the order.  
- Webhook verification supported via `RAZORPAY_WEBHOOK_SECRET` (optional but recommended).  

`MINIMUM_ORDER_VALUE` source:

```4:10:client/src/utils/constants.js
export const MINIMUM_ORDER_VALUE = 99; // Minimum cart value in rupees
export const DELIVERY_FEE = 0; // Delivery fee (free delivery)
export const MINIMUM_ORDER_MESSAGE = `Minimum order value is ₹${MINIMUM_ORDER_VALUE}`;
```

---

## 🧩 Backend (Express)

### Endpoints (see `server/route/order.route.js`)
- `POST /api/order/razorpay-checkout` → create Razorpay order (online pay).
- `POST /api/order/razorpay-verify` → verify signature + create order.
- `POST /api/order/razorpay-webhook` → handle Razorpay webhooks.
- `POST /api/order/partial-prepayment-checkout` → create order for prepayment amount.
- `POST /api/order/partial-prepayment-verify` → verify prepayment + create order with COD remainder.
- All payment routes are wrapped with `rateLimitPayment`.

### Razorpay order creation

```363:435:server/controllers/order.controller.js
export async function razorpayCheckoutController(request, response) {
    const userId = request.userId;
    const { list_items, totalAmt, addressId, subTotalAmt, deliverySlot, deliveryDate } = request.body;
    if (!list_items || !totalAmt || !addressId) return response.status(400).json({ ... });
    if (!deliverySlot || !deliveryDate) return response.status(400).json({ ... });
    const user = await UserModel.findById(userId);
    const options = {
        amount: Math.round(totalAmt * 100), // paise
        currency: "INR",
        receipt: `receipt_order_${new mongoose.Types.ObjectId()}`,
        notes: { userId, addressId, customerEmail: user.email, customerName: user.name }
    };
    const razorpayOrder = await razorpayInstance.orders.create(options);
    return response.status(200).json({
        data: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, key_id: process.env.RAZORPAY_KEY_ID, list_items, addressId, subTotalAmt, totalAmt, deliverySlot, deliveryDate, customerName: user.name, customerEmail: user.email, customerPhone: user.mobile || '' }
    });
}
```

### Signature verification + order creation

```451:546:server/controllers/order.controller.js
export async function verifyRazorpayPaymentController(request, response) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, list_items, addressId, subTotalAmt, totalAmt, deliverySlot, deliveryDate } = request.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");
    if (expectedSignature !== razorpay_signature) return response.status(400).json({ message: "Payment verification failed" });
    const payload = list_items.map(el => ({ userId: request.userId, orderId: `ORD-${new mongoose.Types.ObjectId()}`, productId: el.productId._id, product_details: { name: el.productId.name, image: el.productId.image }, paymentId: razorpay_payment_id, payment_status: "PAID", payment_method: 'online', delivery_address: addressId, subTotalAmt, totalAmt, order_status: 'CONFIRMED', delivery_slot: deliverySlot, delivery_date: new Date(deliveryDate) }));
    const generatedOrder = await OrderModel.insertMany(payload);
    await CartProductModel.deleteMany({ userId: request.userId }); await UserModel.updateOne({ _id: request.userId }, { shopping_cart: [] });
    return response.json({ success: true, data: generatedOrder });
}
```

### Partial prepayment (COD fraud reduction)

Calculator:

```11:38:server/utils/calculatePartialPayment.js
const MIN_PREPAYMENT = 20;
const MAX_PREPAYMENT = 100;
const PREPAYMENT_PERCENTAGE = 10;
const calculatedPrepayment = Math.round(orderTotal * (PREPAYMENT_PERCENTAGE / 100));
const prepaymentAmount = Math.max(MIN_PREPAYMENT, Math.min(calculatedPrepayment, MAX_PREPAYMENT));
const codAmount = orderTotal - prepaymentAmount;
return { prepaymentAmount, codAmount, total: orderTotal, percentage: parseFloat(((prepaymentAmount / orderTotal) * 100).toFixed(1)) };
```

Checkout (creates Razorpay order for the prepayment only):

```1077:1163:server/controllers/order.controller.js
export async function partialPrepaymentCheckoutController(request, response) {
    const { list_items, totalAmt, addressId, subTotalAmt, deliverySlot, deliveryDate } = request.body;
    if (!deliverySlot || !deliveryDate) return response.status(400).json({ message: "Please select a delivery slot and date" });
    const paymentBreakdown = calculatePartialPayment(totalAmt); // ₹20–₹100 or 10%
    const user = await UserModel.findById(request.userId);
    const options = {
        amount: Math.round(paymentBreakdown.prepaymentAmount * 100),
        currency: "INR",
        receipt: `prepay_${new mongoose.Types.ObjectId()}`,
        notes: { userId: request.userId, addressId, customerEmail: user.email, customerName: user.name, orderType: 'partial_prepayment', prepaymentAmount: paymentBreakdown.prepaymentAmount, codAmount: paymentBreakdown.codAmount, totalAmount: paymentBreakdown.total }
    };
    const razorpayOrder = await razorpayInstance.orders.create(options);
    return response.status(200).json({ success: true, data: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, key_id: process.env.RAZORPAY_KEY_ID, paymentBreakdown, list_items, addressId, subTotalAmt, totalAmt, deliverySlot, deliveryDate, customerName: user.name, customerEmail: user.email, customerPhone: user.mobile || '' } });
}
```

Verification (marks partial prepayment + COD amounts on the order):

```1191:1326:server/controllers/order.controller.js
export async function verifyPartialPrepaymentController(request, response) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, list_items, addressId, subTotalAmt, totalAmt, deliverySlot, deliveryDate } = request.body;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update((razorpay_order_id + "|" + razorpay_payment_id).toString()).digest("hex");
    if (expectedSignature !== razorpay_signature) return response.status(400).json({ message: "Payment verification failed - Invalid signature" });
    const paymentBreakdown = calculatePartialPayment(totalAmt);
    const payload = list_items.map(el => ({
        userId: request.userId,
        orderId: `ORD-${new mongoose.Types.ObjectId()}`,
        productId: el.productId._id,
        product_details: { name: el.productId.name, image: el.productId.image },
        paymentId: razorpay_payment_id,
        payment_status: "PARTIAL PREPAYMENT + COD",
        payment_method: "partial_prepayment",
        prepayment_amount: paymentBreakdown.prepaymentAmount,
        cod_amount: paymentBreakdown.codAmount,
        prepayment_status: "completed",
        prepayment_transaction_id: razorpay_payment_id,
        delivery_address: addressId,
        subTotalAmt,
        totalAmt,
        order_status: 'CONFIRMED',
        delivery_slot: deliverySlot,
        delivery_date: new Date(deliveryDate)
    }));
    const generatedOrder = await OrderModel.insertMany(payload);
    await CartProductModel.deleteMany({ userId: request.userId }); await UserModel.updateOne({ _id: request.userId }, { shopping_cart: [] });
    return response.json({ success: true, data: { orders: generatedOrder, paymentBreakdown } });
}
```

### Webhook (optional)
`POST /api/order/razorpay-webhook` verifies `x-razorpay-signature` with `RAZORPAY_WEBHOOK_SECRET` and logs events like `payment.captured` and `payment.failed` (sends failure email if customer email is present).

---

## 🖥️ Frontend (React; port easily to Next.js)

- Razorpay script loaded once via `useEffect`:

```178:188:client/src/pages/CheckoutPage.jsx
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  document.body.appendChild(script);
  return () => { document.body.removeChild(script); };
}, []);
```

- Validation before showing payment options (cart present, ₹99 min, address + delivery slot/date):

```74:123:client/src/pages/CheckoutPage.jsx
const handleCODButtonClick = () => {
  if (!cartItemsList || cartItemsList.length === 0) { toast.error("Your cart is empty..."); return; }
  if (totalPrice < MINIMUM_ORDER_VALUE) { const remaining = MINIMUM_ORDER_VALUE - totalPrice; toast.error(`Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${remaining.toFixed(2)} more to checkout.`); return; }
  if (!addressList[selectAddress]?._id) { toast.error("Please select a delivery address"); return; }
  if (!selectedDeliveryDate || !selectedDeliverySlot) { toast.error("Please select a delivery date/time slot"); return; }
  setShowPaymentModal(true);
};
```

- Online payment flow (creates order → opens Razorpay → verifies → navigates to success):

```190:344:client/src/pages/CheckoutPage.jsx
const handleOnlinePayment = async() => {
  // same validations as above...
  const response = await Axios({ ...SummaryApi.razorpay_checkout, data: { list_items: cartItemsList, addressId: addressList[selectAddress]?._id, subTotalAmt: totalPrice, totalAmt: totalPrice, deliverySlot: selectedDeliverySlot, deliveryDate: selectedDeliveryDate } });
  const orderData = response.data.data;
  const options = {
    key: orderData.key_id, amount: orderData.amount, currency: orderData.currency, order_id: orderData.id,
    handler: async (response) => {
      const verifyResponse = await Axios({ ...SummaryApi.razorpay_verify, data: { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, list_items: orderData.list_items, addressId: orderData.addressId, subTotalAmt: orderData.subTotalAmt, totalAmt: orderData.totalAmt, deliverySlot: orderData.deliverySlot, deliveryDate: orderData.deliveryDate } });
      if (verifyResponse.data.success) navigate('/success', { state: { orderData: { items: orderData.list_items, address: addressList[selectAddress], totalAmount: orderData.totalAmt, subTotal: orderData.subTotalAmt, paymentMethod: "Online Payment", paymentId: response.razorpay_payment_id, deliverySlot: selectedDeliverySlot, deliveryDate: selectedDeliveryDate, orderDate: new Date().toISOString() } } });
    }
  };
  new window.Razorpay(options).open();
};
```

- Partial prepayment flow (token amount online + COD):

```352:499:client/src/pages/CheckoutPage.jsx
const handlePartialPrepayment = async() => {
  // same validations...
  const response = await Axios({ ...SummaryApi.partial_prepayment_checkout, data: { list_items: cartItemsList, addressId: addressList[selectAddress]?._id, subTotalAmt: totalPrice, totalAmt: totalPrice, deliverySlot: selectedDeliverySlot, deliveryDate: selectedDeliveryDate } });
  const orderData = response.data.data; const breakdown = orderData.paymentBreakdown;
  const options = {
    key: orderData.key_id, amount: orderData.amount, currency: orderData.currency, order_id: orderData.id,
    description: `Prepayment: ₹${breakdown.prepaymentAmount} (${breakdown.percentage}%) | COD: ₹${breakdown.codAmount}`,
    handler: async (response) => {
      const verifyResponse = await Axios({ ...SummaryApi.partial_prepayment_verify, data: { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, list_items: orderData.list_items, addressId: orderData.addressId, subTotalAmt: orderData.subTotalAmt, totalAmt: orderData.totalAmt, deliverySlot: orderData.deliverySlot, deliveryDate: orderData.deliveryDate } });
      if (verifyResponse.data.success) navigate('/success', { state: { orderData: { items: orderData.list_items, address: addressList[selectAddress], totalAmount: orderData.totalAmt, subTotal: orderData.subTotalAmt, paymentMethod: `Partial Prepayment (₹${breakdown.prepaymentAmount} paid + ₹${breakdown.codAmount} COD)`, paymentId: response.razorpay_payment_id, deliverySlot: selectedDeliverySlot, deliveryDate: selectedDeliveryDate, orderDate: new Date().toISOString(), prepaymentAmount: breakdown.prepaymentAmount, codAmount: breakdown.codAmount, isPartialPrepayment: true } } });
    }
  };
  new window.Razorpay(options).open();
};
```

---

## 🌐 Environment Variables

**Server (`server/.env`):**
```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=optional_for_webhooks
FRONTEND_URL=http://localhost:5173
```

**Client (`client/.env` or Next.js `NEXT_PUBLIC_*`):**
```
VITE_API_URL=http://localhost:8080   # replace with NEXT_PUBLIC_API_URL in Next.js
VITE_RAZORPAY_KEY_ID=rzp_test_xxx    # public key (also returned by backend)
```

---

## 🛠️ Porting to Next.js (app router)

1) Keep the Express backend (recommended) or mirror the controllers in Next.js API routes (`/app/api/order/.../route.js`).  
2) Use a **client component** for checkout; load Razorpay script inside `useEffect` to avoid SSR window errors.  
3) Call the same backend endpoints for `razorpay-checkout`, `razorpay-verify`, `partial-prepayment-*`.  
4) Read env via `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID` for client-side key if you want to skip returning it from the backend.  
5) Preserve the validations: minimum order ₹99, address selected, delivery slot/date selected.  
6) Reuse the payment breakdown memo and partial prepayment calculator logic (or import it into a shared package).  
7) For webhooks, expose `/api/order/razorpay-webhook` as a Next.js route handler and verify `x-razorpay-signature` the same way.

---

## ✅ Testing

- Razorpay test card: `4111111111111111`, CVV any 3 digits, expiry any future date.  
- Toggle Razorpay Dashboard to **Test Mode** for sandbox orders.  
- Verify signature failure by tampering `razorpay_signature` to confirm server-side protection.  

---

## 📌 Quick Checklist

- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` set on server.  
- [ ] `VITE_API_URL`/`NEXT_PUBLIC_API_URL` and (optionally) `VITE_RAZORPAY_KEY_ID` set on client.  
- [ ] ₹99 minimum order + delivery slot/date enforced before calling payment APIs.  
- [ ] Partial prepayment calculator in place (₹20–₹100, 10%).  
- [ ] Webhook secret configured and verified (if using webhooks).  
- [ ] Success page receives full order payload (items, address, payment method, slot/date).  

