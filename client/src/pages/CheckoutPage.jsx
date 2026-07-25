import React, { useState, useEffect, useMemo } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import AddAddress from '../components/AddAddress'
import DeliverySlotSelector from '../components/DeliverySlotSelector'
import { useSelector } from 'react-redux'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'
import { FaHome, FaBriefcase, FaMapMarkerAlt, FaCreditCard, FaPhone, FaExclamationTriangle, FaShoppingBag, FaClock, FaShieldAlt, FaUndo, FaEdit, FaArrowLeft, FaCheckCircle, FaTimes } from 'react-icons/fa'
import { MINIMUM_ORDER_VALUE } from '../utils/constants'
import RecommendedProducts from '../components/RecommendedProducts'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton'
import { Package, Truck, MapPin } from 'lucide-react'
import DisplayCartItem from '../components/DisplayCartItem'

const CheckoutPage = () => {
  const { notDiscountTotalPrice, totalPrice, totalQty, fetchCartItem,fetchOrder } = useGlobalContext()
  const [openAddress, setOpenAddress] = useState(false)
  const [openCartSection, setOpenCartSection] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const addressList = useSelector(state => state.addresses.addressList)
  const [selectAddress, setSelectAddress] = useState(null) // Changed to null - no default selection
  const cartItemsList = useSelector(state => state.cartItem.cart)
  const navigate = useNavigate()
  
  // Delivery slot state
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState('')
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState('')

  // Calculate partial payment breakdown
  const partialPaymentBreakdown = useMemo(() => {
    const MIN_PREPAYMENT = 20
    const MAX_PREPAYMENT = 100
    const PREPAYMENT_PERCENTAGE = 10

    const calculatedPrepayment = Math.round(totalPrice * (PREPAYMENT_PERCENTAGE / 100))
    const prepaymentAmount = Math.max(MIN_PREPAYMENT, Math.min(calculatedPrepayment, MAX_PREPAYMENT))
    const codAmount = totalPrice - prepaymentAmount

    return {
      prepaymentAmount,
      codAmount,
      total: totalPrice,
      percentage: ((prepaymentAmount / totalPrice) * 100).toFixed(1)
    }
  }, [totalPrice])

  // Auto-select first address if available
  useEffect(() => {
    if (addressList && addressList.length > 0 && selectAddress === null) {
      const firstActiveAddress = addressList.findIndex(addr => addr.status !== false)
      if (firstActiveAddress !== -1) {
        setSelectAddress(firstActiveAddress)
      }
    }
  }, [addressList])

  // Get icon for address type
  const getAddressIcon = (type) => {
    switch(type) {
      case 'HOME':
        return <FaHome className='text-red-600' />;
      case 'WORK':
        return <FaBriefcase className='text-blue-600' />;
      default:
        return <FaMapMarkerAlt className='text-green-600' />;
    }
  }

  // Handler to show payment options modal
  const handleCODButtonClick = () => {
    // Validate before showing modal
    if (!cartItemsList || cartItemsList.length === 0) {
      toast.error("Your cart is empty. Please add items before checkout.");
      return;
    }

    if (totalPrice < MINIMUM_ORDER_VALUE) {
      const remaining = MINIMUM_ORDER_VALUE - totalPrice;
      toast.error(`Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${remaining.toFixed(2)} more to checkout.`, {
        duration: 5000
      });
      return;
    }

    if (!addressList[selectAddress]?._id) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!selectedDeliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    if (!selectedDeliverySlot) {
      toast.error("Please select a delivery time slot");
      return;
    }

    // All validations passed - show payment options modal
    setShowPaymentModal(true);
  }

  const handleCashOnDelivery = async() => {
      try {
          // Validate cart has items
          if (!cartItemsList || cartItemsList.length === 0) {
            toast.error("Your cart is empty. Please add items before checkout.");
            return;
          }

          // Validate minimum order value
          if (totalPrice < MINIMUM_ORDER_VALUE) {
            const remaining = MINIMUM_ORDER_VALUE - totalPrice;
            toast.error(`Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${remaining.toFixed(2)} more to checkout.`, {
              duration: 5000
            });
            return;
          }

          // Validate address is selected
          if (!addressList[selectAddress]?._id) {
            toast.error("Please select a delivery address");
            return;
          }

          const response = await Axios({
            ...SummaryApi.CashOnDeliveryOrder,
            data : {
              list_items : cartItemsList,
              addressId : addressList[selectAddress]?._id,
              subTotalAmt : totalPrice,
              totalAmt :  totalPrice,
              deliverySlot : selectedDeliverySlot,
              deliveryDate : selectedDeliveryDate
            }
          })

          const { data : responseData } = response

          if(responseData.success){
              toast.success(responseData.message)
              if(fetchCartItem){
                fetchCartItem()
              }
              if(fetchOrder){
                fetchOrder()
              }
              
              // Pass complete order data to success page
              navigate('/success',{
                state : {
                  text : "Order",
                  orderData: {
                    items: cartItemsList,
                    address: addressList[selectAddress],
                    totalAmount: totalPrice,
                    subTotal: totalPrice,
                    paymentMethod: "Cash on Delivery",
                    deliverySlot: selectedDeliverySlot,
                    deliveryDate: selectedDeliveryDate,
                    orderDate: new Date().toISOString(),
                    orderId: responseData.data?.[0]?.orderId
                  }
                }
              })
          }

      } catch (error) {
        AxiosToastError(error)
      }
  }

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleOnlinePayment = async() => {
    try {
      // Validate cart has items
      if (!cartItemsList || cartItemsList.length === 0) {
        toast.error("Your cart is empty. Please add items before checkout.");
        return;
      }

      // Validate minimum order value
      if (totalPrice < MINIMUM_ORDER_VALUE) {
        const remaining = MINIMUM_ORDER_VALUE - totalPrice;
        toast.error(`Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${remaining.toFixed(2)} more to checkout.`, {
          duration: 5000
        });
        return;
      }

      // Validate address selection
      if (!addressList[selectAddress]?._id) {
        toast.error("Please select a delivery address");
        return;
      }

      // Validate delivery slot
      if (!selectedDeliveryDate) {
        toast.error("Please select a delivery date");
        return;
      }

      if (!selectedDeliverySlot) {
        toast.error("Please select a delivery time slot");
        return;
      }

      const loadingToast = toast.loading("Initializing payment...");

      // Create Razorpay order
      const response = await Axios({
        ...SummaryApi.razorpay_checkout,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: totalPrice,
          deliverySlot: selectedDeliverySlot,
          deliveryDate: selectedDeliveryDate
        }
      });

      const { data: responseData } = response;
      toast.dismiss(loadingToast);

      if (!responseData.success) {
        toast.error(responseData.message || "Failed to create order");
        return;
      }

      const orderData = responseData.data;

      // Razorpay checkout options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Quickart',
        description: 'Quick Commerce - Fresh & Fast Delivery',
        image: '/logo.png',
        order_id: orderData.id,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone
        },
        theme: {
          color: '#DC2626' // Quickart brand red
        },
        handler: async function (response) {
          try {
            const verifyLoadingToast = toast.loading("Verifying payment...");
            
            // Verify payment on backend
            const verifyResponse = await Axios({
              ...SummaryApi.razorpay_verify,
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                list_items: orderData.list_items,
                addressId: orderData.addressId,
                subTotalAmt: orderData.subTotalAmt,
                totalAmt: orderData.totalAmt,
                deliverySlot: orderData.deliverySlot,
                deliveryDate: orderData.deliveryDate
              }
            });

            toast.dismiss(verifyLoadingToast);

            const { data: verifyData } = verifyResponse;

            if (verifyData.success) {
              toast.success("Payment successful! Order placed.");
              
              // Refresh cart and orders
              if (fetchCartItem) {
                fetchCartItem();
              }
              if (fetchOrder) {
                fetchOrder();
              }

              // Navigate to success page with complete order data
              navigate('/success', {
                state: {
                  text: "Order",
                  orderData: {
                    items: orderData.list_items,
                    address: addressList[selectAddress],
                    totalAmount: orderData.totalAmt,
                    subTotal: orderData.subTotalAmt,
                    paymentMethod: "Online Payment",
                    paymentId: response.razorpay_payment_id,
                    deliverySlot: selectedDeliverySlot,
                    deliveryDate: selectedDeliveryDate,
                    orderDate: new Date().toISOString(),
                    orderId: verifyData.data?.[0]?.orderId
                  }
                }
              });
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            AxiosToastError(verifyError);
          }
        },
        modal: {
          ondismiss: function() {
            toast.error("Payment cancelled");
          }
        },
        notes: {
          description: 'Payment for Quickart order'
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(response.error.description || "Payment failed. Please try again.");
      });
      
      razorpay.open();

    } catch (error) {
      console.error("Payment error:", error);
      AxiosToastError(error);
    }
  }

  /**
   * Partial Prepayment Handler
   * COD Fraud Prevention Strategy:
   * - Customer pays small token (₹20-100) online
   * - Rest amount collected as COD at delivery
   * - Reduces fake orders by 60-80%
   */
  const handlePartialPrepayment = async() => {
    try {
      // Validate cart has items
      if (!cartItemsList || cartItemsList.length === 0) {
        toast.error("Your cart is empty. Please add items before checkout.");
        return;
      }

      // Validate minimum order value
      if (totalPrice < MINIMUM_ORDER_VALUE) {
        const remaining = MINIMUM_ORDER_VALUE - totalPrice;
        toast.error(`Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${remaining.toFixed(2)} more to checkout.`, {
          duration: 5000
        });
        return;
      }

      // Validate address selection
      if (!addressList[selectAddress]?._id) {
        toast.error("Please select a delivery address");
        return;
      }

      // Validate delivery slot
      if (!selectedDeliveryDate) {
        toast.error("Please select a delivery date");
        return;
      }

      if (!selectedDeliverySlot) {
        toast.error("Please select a delivery time slot");
        return;
      }

      const loadingToast = toast.loading("Calculating payment breakdown...");

      // Create partial prepayment order
      const response = await Axios({
        ...SummaryApi.partial_prepayment_checkout,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: totalPrice,
          deliverySlot: selectedDeliverySlot,
          deliveryDate: selectedDeliveryDate
        }
      });

      const { data: responseData } = response;
      toast.dismiss(loadingToast);

      if (!responseData.success) {
        toast.error(responseData.message || "Failed to create order");
        return;
      }

      const orderData = responseData.data;
      const breakdown = orderData.paymentBreakdown;

      // Show payment breakdown to user
      toast.success(
        `Pay ₹${breakdown.prepaymentAmount} now, ₹${breakdown.codAmount} on delivery`, 
        { duration: 4000 }
      );

      // Razorpay checkout options for PREPAYMENT ONLY
      const options = {
        key: orderData.key_id,
        amount: orderData.amount, // This is prepayment amount in paise
        currency: orderData.currency,
        name: 'Quickart',
        description: `Prepayment: ₹${breakdown.prepaymentAmount} (${breakdown.percentage}%) | COD: ₹${breakdown.codAmount}`,
        image: '/logo.png',
        order_id: orderData.id,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone
        },
        theme: {
          color: '#DC2626' // Quickart brand red
        },
        handler: async function (response) {
          try {
            const verifyLoadingToast = toast.loading("Verifying prepayment...");
            
            // Verify prepayment on backend
            const verifyResponse = await Axios({
              ...SummaryApi.partial_prepayment_verify,
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                list_items: orderData.list_items,
                addressId: orderData.addressId,
                subTotalAmt: orderData.subTotalAmt,
                totalAmt: orderData.totalAmt,
                deliverySlot: orderData.deliverySlot,
                deliveryDate: orderData.deliveryDate
              }
            });

            toast.dismiss(verifyLoadingToast);

            const { data: verifyData } = verifyResponse;

            if (verifyData.success) {
              toast.success(
                `Prepayment successful! Pay ₹${verifyData.data.paymentBreakdown.codAmount} to delivery partner.`,
                { duration: 6000 }
              );
              
              // Refresh cart and orders
              if (fetchCartItem) {
                fetchCartItem();
              }
              if (fetchOrder) {
                fetchOrder();
              }

              // Navigate to success page
              navigate('/success', {
                state: {
                  text: "Order",
                  orderData: {
                    items: orderData.list_items,
                    address: addressList[selectAddress],
                    totalAmount: orderData.totalAmt,
                    subTotal: orderData.subTotalAmt,
                    paymentMethod: `Partial Prepayment (₹${breakdown.prepaymentAmount} paid + ₹${breakdown.codAmount} COD)`,
                    paymentId: response.razorpay_payment_id,
                    deliverySlot: selectedDeliverySlot,
                    deliveryDate: selectedDeliveryDate,
                    orderDate: new Date().toISOString(),
                    orderId: verifyData.data?.[0]?.orderId,
                    // Partial prepayment specific data
                    prepaymentAmount: breakdown.prepaymentAmount,
                    codAmount: breakdown.codAmount,
                    isPartialPrepayment: true
                  }
                }
              });
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch (verifyError) {
            console.error("Prepayment verification error:", verifyError);
            AxiosToastError(verifyError);
          }
        },
        modal: {
          ondismiss: function() {
            toast.error("Payment cancelled. Your order was not placed.");
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error("Partial prepayment error:", error);
      AxiosToastError(error);
    }
  }

  return (
    <section className='bg-gray-50 min-h-screen pb-8'>
      {/* Progress Indicator */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm'>
        <div className='container mx-auto px-3 md:px-4 lg:px-6 py-4'>
          {/* Back Button */}
          <Link to="/" className='inline-flex items-center text-red-600 hover:text-red-700 font-medium mb-4 transition-colors'>
            <FaArrowLeft className='mr-2' size={16} />
            Continue Shopping
          </Link>
          
          {/* Progress Steps */}
          <div className='flex items-center justify-between max-w-2xl mx-auto'>
            <div className='flex flex-col items-center flex-1'>
              <div className='w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center mb-2 shadow-lg'>
                <FaShoppingBag />
              </div>
              <span className='text-xs md:text-sm font-semibold text-red-600'>Cart</span>
            </div>
            
            <div className='flex-1 h-1 bg-red-600 mx-2 -mt-6'></div>
            
            <div className='flex flex-col items-center flex-1'>
              <div className='w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center mb-2 shadow-lg'>
                <MapPin size={20} />
              </div>
              <span className='text-xs md:text-sm font-semibold text-red-600'>Address</span>
            </div>
            
            <div className='flex-1 h-1 bg-gray-300 mx-2 -mt-6'></div>
            
            <div className='flex flex-col items-center flex-1'>
              <div className='w-10 h-10 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center mb-2'>
                <FaCreditCard />
              </div>
              <span className='text-xs md:text-sm text-gray-500'>Payment</span>
            </div>
            
            <div className='flex-1 h-1 bg-gray-300 mx-2 -mt-6'></div>
            
            <div className='flex flex-col items-center flex-1'>
              <div className='w-10 h-10 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center mb-2'>
                <FaCheckCircle />
              </div>
              <span className='text-xs md:text-sm text-gray-500'>Done</span>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto p-3 md:p-4 lg:p-6 flex flex-col lg:flex-row w-full gap-4 lg:gap-6 justify-between mt-4'>
        {/* Left Section - Cart Items & Address */}
        <div className='w-full lg:flex-1 space-y-4 lg:space-y-6'>
          
          {/* Cart Items Section */}
          <div className='bg-white rounded-xl shadow-md p-4 md:p-5'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg md:text-xl font-bold text-red-700 flex items-center gap-2'>
                <Package size={24} className='text-red-600' />
                Review Your Items ({totalQty} {totalQty === 1 ? 'item' : 'items'})
              </h3>
              <button 
                onClick={() => setOpenCartSection(true)}
                className='text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1 transition-colors'
              >
                <FaEdit size={14} />
                Edit Cart
              </button>
            </div>

            {/* Savings Badge */}
            {(notDiscountTotalPrice - totalPrice) > 0 && (
              <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4'>
                <div className='text-green-700 font-semibold text-sm flex items-center gap-2'>
                  <FaShieldAlt />
                  You're saving {DisplayPriceInRupees(notDiscountTotalPrice - totalPrice)} on this order! 🎉
                </div>
              </div>
            )}

            {/* Cart Items List */}
            {cartItemsList && cartItemsList.length > 0 ? (
              <div className='space-y-4 max-h-96 overflow-y-auto'>
                {cartItemsList.map((item, index) => (
                  <div key={item?._id || index} className='flex gap-4 p-3 border border-gray-200 rounded-lg hover:border-red-200 hover:shadow-sm transition-all'>
                    {/* Product Image */}
                    <div className='w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden'>
                      <img
                        src={item?.productId?.image[0]}
                        alt={item?.productId?.name || 'Product'}
                        className='w-full h-full object-contain'
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className='flex-1 min-w-0'>
                      <h4 className='text-sm md:text-base font-semibold text-gray-800 line-clamp-2 mb-1'>
                        {item?.productId?.name}
                      </h4>
                      <p className='text-xs text-gray-500 mb-2'>{item?.productId?.unit}</p>
                      
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-base md:text-lg font-bold text-red-600'>
                          {DisplayPriceInRupees(pricewithDiscount(item?.productId?.price, item?.productId?.discount))}
                        </span>
                        {item?.productId?.discount > 0 && (
                          <>
                            <span className='text-sm text-gray-400 line-through'>
                              {DisplayPriceInRupees(item?.productId?.price)}
                            </span>
                            <span className='text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded'>
                              {item?.productId?.discount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className='flex flex-col justify-center'>
                      <AddToCartButton data={item?.productId} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <FaShoppingBag className='mx-auto mb-2' size={48} />
                <p>Your cart is empty</p>
              </div>
            )}

            {/* Delivery Info */}
            <div className='mt-4 pt-4 border-t border-gray-200'>
              <div className='flex items-center gap-3 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3'>
                <FaClock className='text-blue-600 flex-shrink-0' size={20} />
                <div>
                  <p className='font-semibold text-blue-900'>Scheduled Slot Delivery</p>
                  <p className='text-blue-700'>Choose your preferred delivery time slot below</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className='bg-white rounded-xl shadow-md p-4 md:p-5'>
            <h3 className='text-lg md:text-xl font-bold text-red-700 mb-4 flex items-center gap-2'>
              <Truck size={24} className='text-red-600' />
              Delivery Address
            </h3>
            
            {/* Warning if no addresses */}
            {addressList.length === 0 && (
              <div className='bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4'>
                <div className='text-yellow-800 font-medium text-sm'>
                  <div className='flex items-start gap-2'>
                    <FaExclamationTriangle className='text-yellow-600 mt-0.5 flex-shrink-0' />
                    <span>No delivery address found. Please add an address to continue with checkout.</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className='grid gap-3 md:gap-4'>
              {
                addressList.map((address, index) => {
                  return (
                    <label 
                      key={address._id || index} 
                      htmlFor={"address" + index} 
                      className={!address.status ? "hidden" : ""}
                    >
                      <div className={`border-2 rounded-lg p-3 md:p-4 flex gap-3 cursor-pointer transition-all duration-200 ${
                        selectAddress === index 
                          ? 'border-red-600 bg-red-50 shadow-md' 
                          : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                      }`}>
                        <div className='pt-1'>
                          <input 
                            id={"address" + index} 
                            type='radio' 
                            value={index} 
                            checked={selectAddress === index}
                            onChange={(e) => setSelectAddress(Number(e.target.value))} 
                            name='address'
                            className='w-5 h-5 text-red-600 cursor-pointer focus:ring-2 focus:ring-red-500'
                          />
                        </div>
                        <div className='flex-1'>
                          {/* Address Type Badge */}
                          <div className='flex items-center gap-2 mb-2'>
                            <div className='flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold'>
                              {getAddressIcon(address.address_type || 'HOME')}
                              <span className='ml-1'>{address.address_type || 'HOME'}</span>
                            </div>
                            {selectAddress === index && (
                              <span className='px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1'>
                                <FaCheckCircle size={12} />
                                Selected
                              </span>
                            )}
                          </div>
                          
                          <div className='text-sm md:text-base'>
                            <p className='font-medium text-gray-800'>{address.address_line}</p>
                            <p className='text-gray-600'>{address.city}, {address.state}</p>
                            <p className='text-gray-600'>{address.country} - {address.pincode}</p>
                            <div className='text-gray-600 mt-1 flex items-center gap-2'>
                              <FaPhone className='text-gray-500' size={12} />
                              {address.mobile}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })
              }
              <button 
                onClick={() => setOpenAddress(true)} 
                className='h-16 bg-white border-2 border-dashed border-red-300 rounded-lg flex justify-center items-center cursor-pointer hover:bg-red-50 hover:border-red-500 transition-all duration-200 text-red-600 font-medium'
              >
                + Add New Address
              </button>
            </div>

            {/* Warning if no address selected */}
            {(addressList.length > 0 && selectAddress === null) && (
              <div className='mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4 animate-pulse'>
                <div className='flex items-start gap-2'>
                  <FaExclamationTriangle className='text-red-600 mt-0.5 flex-shrink-0' size={20} />
                  <div>
                    <p className='text-red-800 font-semibold mb-1'>
                      ⚠️ Please Select a Delivery Address
                    </p>
                    <p className='text-red-700 text-sm'>
                      Click on any address above to select it as your delivery location. Payment options will be enabled after selection.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Slot Selection */}
          <DeliverySlotSelector
            selectedSlot={selectedDeliverySlot}
            onSlotChange={setSelectedDeliverySlot}
            selectedDate={selectedDeliveryDate}
            onDateChange={setSelectedDeliveryDate}
          />
        </div>

        {/* Summary Section */}
        <div className='w-full lg:w-96 lg:sticky lg:top-40 h-fit'>
          <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-5'>
            <h3 className='text-lg md:text-xl font-bold text-red-700 mb-4 flex items-center gap-2'>
              <FaShoppingBag />
              Order Summary
            </h3>
            
            {/* Price Breakdown */}
            <div className='space-y-3 mb-4 pb-4 border-b border-gray-200'>
              <div className='flex justify-between text-sm md:text-base text-gray-700'>
                <span>Items total ({totalQty} items)</span>
                <span className='font-semibold text-gray-900'>{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
              </div>
              
              {(notDiscountTotalPrice - totalPrice) > 0 && (
                <div className='flex justify-between text-sm md:text-base text-green-600'>
                  <span>Product discounts</span>
                  <span className='font-semibold'>-{DisplayPriceInRupees(notDiscountTotalPrice - totalPrice)}</span>
                </div>
              )}
              
              <div className='flex justify-between text-sm md:text-base text-gray-700'>
                <span>Delivery Charge</span>
                <div className='flex items-center gap-2'>
                  <span className='line-through text-gray-400 text-xs'>₹40</span>
                  <span className='font-medium text-green-600 font-semibold'>FREE</span>
                </div>
              </div>
            </div>
            
            <div className='flex items-center justify-between mb-5 pb-4 border-b border-gray-200'>
              <span className='text-base md:text-lg font-bold text-gray-900'>Grand Total</span>
              <span className='text-lg md:text-xl font-bold text-red-600'>{DisplayPriceInRupees(totalPrice)}</span>
            </div>
            
            {/* Minimum Order Warning */}
            {totalPrice < MINIMUM_ORDER_VALUE && (
              <div className='bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-4 animate-pulse'>
                <div className='flex items-start gap-2'>
                  <FaExclamationTriangle className='text-yellow-600 mt-0.5 flex-shrink-0' />
                  <div className='text-sm'>
                    <p className='text-yellow-800 font-semibold mb-1'>
                      Minimum order: ₹{MINIMUM_ORDER_VALUE}
                    </p>
                    <p className='text-yellow-700'>
                      Add ₹{(MINIMUM_ORDER_VALUE - totalPrice).toFixed(2)} more to proceed with checkout
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className='flex flex-col gap-3'>
              <button 
                disabled={selectAddress === null || !addressList[selectAddress]?._id || cartItemsList.length === 0 || totalPrice < MINIMUM_ORDER_VALUE}
                className={`w-full py-3 px-4 rounded-lg font-semibold shadow-lg transition-all duration-300 text-sm md:text-base ${
                  selectAddress === null || !addressList[selectAddress]?._id || cartItemsList.length === 0 || totalPrice < MINIMUM_ORDER_VALUE
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-xl hover:scale-105'
                }`}
                onClick={handleOnlinePayment}
              >
                <FaCreditCard className='inline mr-2' /> Online Payment
              </button>

              {/* Cash on Delivery - Now with Partial Prepayment (Fraud Prevention) */}
              <button 
                disabled={selectAddress === null || !addressList[selectAddress]?._id || cartItemsList.length === 0 || totalPrice < MINIMUM_ORDER_VALUE}
                className={`w-full py-3 px-4 rounded-lg font-semibold shadow-md transition-all duration-300 text-sm md:text-base ${
                  selectAddress === null || !addressList[selectAddress]?._id || cartItemsList.length === 0 || totalPrice < MINIMUM_ORDER_VALUE
                    ? 'bg-gray-200 text-gray-500 border-2 border-gray-300 cursor-not-allowed opacity-60'
                    : 'border-2 border-red-600 text-red-700 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 hover:text-white hover:scale-105'
                }`}
                onClick={handleCODButtonClick}
              >
                <div className='flex flex-col items-center gap-1'>
                  <span className='flex items-center gap-2'>
                    💵 Cash on Delivery
                  </span>
                  <span className='text-xs font-medium opacity-90'>
                    Pay {DisplayPriceInRupees(partialPaymentBreakdown.prepaymentAmount)} now + {DisplayPriceInRupees(partialPaymentBreakdown.codAmount)} COD
                  </span>
                </div>
              </button>
            </div>

            {/* Disabled State Message */}
            {selectAddress === null && addressList.length > 0 && (
              <div className='mt-3 text-center text-sm text-red-600 font-medium animate-pulse'>
                👆 Select an address to enable payment options
              </div>
            )}

            {/* Trust Badges */}
            <div className='mt-4 pt-4 border-t border-gray-200 space-y-3'>
              <div className='flex items-center gap-2 text-xs text-gray-600'>
                <FaShieldAlt className='text-green-600' />
                <span>100% Secure Payments</span>
              </div>
              <div className='flex items-center gap-2 text-xs text-gray-600'>
                <FaUndo className='text-blue-600' />
                <span>Easy returns & refunds within 7 days</span>
              </div>
              <div className='flex items-center gap-2 text-xs text-gray-600'>
                <FaClock className='text-orange-600' />
                <span>Delivery in your selected time slot</span>
              </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className='mt-4 space-y-3'>
            {/* Return Policy */}
            <div className='bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3'>
              <h4 className='font-semibold text-blue-900 text-sm flex items-center gap-2 mb-2'>
                <FaUndo className='text-blue-600' />
                Return Policy
              </h4>
              <p className='text-xs text-blue-700'>
                Easy returns within 7 days of delivery. Products must be unused and in original packaging.
              </p>
            </div>

            {/* Payment Security */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3'>
              <h4 className='font-semibold text-green-900 text-sm flex items-center gap-2 mb-2'>
                <FaShieldAlt className='text-green-600' />
                100% Secure Payments
              </h4>
              <p className='text-xs text-green-700'>
                Your payment information is encrypted and secure. We support UPI, Cards, Net Banking & COD.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {
        openAddress && (
          <AddAddress close={() => setOpenAddress(false)} />
        )
      }

      {/* Cart Sidebar for Editing */}
      {
        openCartSection && (
          <DisplayCartItem close={() => setOpenCartSection(false)} />
        )
      }
      
      {/* Recommendations */}
      <div className='container mx-auto px-3 md:px-4 lg:px-6 mt-8 md:mt-12'>
        <RecommendedProducts
          type="for-you"
          limit={12}
          title="You May Also Like"
          className="bg-gradient-to-r from-orange-50 to-red-50 -mx-3 md:-mx-4 lg:-mx-6 px-3 md:px-4 lg:px-6 py-6 rounded-xl"
        />
      </div>

      {/* Payment Options Modal */}
      {showPaymentModal && (
        <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn'>
            {/* Modal Header */}
            <div className='sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-2xl font-bold mb-1'>Choose Payment Method</h2>
                  <p className='text-red-100 text-sm'>Select how you'd like to pay for your order</p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className='text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all'
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className='p-6 space-y-4'>
              {/* Order Summary */}
              <div className='bg-gray-50 rounded-xl p-4 border border-gray-200'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-gray-600 font-medium'>Order Total</span>
                  <span className='text-2xl font-bold text-gray-900'>{DisplayPriceInRupees(totalPrice)}</span>
                </div>
                <div className='flex flex-col gap-1 text-sm text-gray-600'>
                  <div className='flex items-center gap-2'>
                    <FaShoppingBag />
                    <span>{totalQty} {totalQty === 1 ? 'item' : 'items'}</span>
                  </div>
                  {selectedDeliveryDate && selectedDeliverySlot && (
                    <div className='flex items-center gap-2 text-xs text-green-700 font-medium'>
                      <FaClock />
                      <span>Delivery: {selectedDeliverySlot} on {new Date(selectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Options */}
              <div className='space-y-4'>
                {/* Option 1: Full Online Payment */}
                <div 
                  onClick={handleOnlinePayment}
                  className='border-2 border-gray-300 hover:border-red-500 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group'
                >
                  <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                      <FaCreditCard className='text-white' size={24} />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='text-lg font-bold text-gray-900'>Full Online Payment</h3>
                        <span className='text-xl font-bold text-green-600'>{DisplayPriceInRupees(totalPrice)}</span>
                      </div>
                      <p className='text-sm text-gray-600'>
                        Pay the complete amount online securely via Card, UPI, or Net Banking
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Partial Prepayment + COD */}
                <div 
                  onClick={() => {
                    setShowPaymentModal(false)
                    handlePartialPrepayment()
                  }}
                  className='border-2 border-red-300 hover:border-red-600 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] bg-red-50 group relative overflow-hidden'
                >
                  {/* Popular Badge */}
                  <div className='absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md'>
                    ⭐ Popular
                  </div>

                  <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                      <span className='text-2xl'>💵</span>
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-lg font-bold text-gray-900 mb-2'>Partial Payment + COD</h3>
                      
                      {/* Payment Breakdown */}
                      <div className='bg-white rounded-lg p-4 mb-3 border border-red-200'>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>Pay Online Now</span>
                            <span className='text-lg font-bold text-red-600'>
                              {DisplayPriceInRupees(partialPaymentBreakdown.prepaymentAmount)}
                            </span>
                          </div>
                          <div className='border-t border-gray-200 pt-2 flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>Pay on Delivery (Cash)</span>
                            <span className='text-lg font-bold text-green-600'>
                              {DisplayPriceInRupees(partialPaymentBreakdown.codAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className='text-sm text-gray-700'>
                        Pay just <span className='font-bold text-red-600'>{DisplayPriceInRupees(partialPaymentBreakdown.prepaymentAmount)}</span> ({partialPaymentBreakdown.percentage}%) now to confirm your order. 
                        Pay the remaining <span className='font-bold text-green-600'>{DisplayPriceInRupees(partialPaymentBreakdown.codAmount)}</span> in cash to the delivery partner.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4'>
                <div className='flex items-start gap-3'>
                  <FaShieldAlt className='text-blue-600 flex-shrink-0 mt-0.5' size={20} />
                  <div className='text-sm text-blue-800'>
                    <p className='font-semibold mb-1'>Why Partial Payment?</p>
                    <p className='text-blue-700'>
                      A small advance payment helps us confirm genuine orders and serve you better. 
                      It's quick, secure, and you still get the flexibility of cash on delivery for most of your order amount!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className='sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl'>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className='w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CheckoutPage
