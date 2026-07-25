import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../provider/GlobalProvider';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { useSelector } from 'react-redux';
import AddToCartButton from './AddToCartButton';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import imageEmpty from '../assets/empty_cart.webp';
import toast from 'react-hot-toast';
import { MINIMUM_ORDER_VALUE } from '../utils/constants';
import {
    X,
    AlertCircle,
    ShoppingCart,
    ChevronRight,
    Sparkles,
    Package,
    Truck,
    IndianRupee,
    ShoppingBag
} from 'lucide-react';

const DisplayCartItem = ({ close }) => {
    const { notDiscountTotalPrice, totalPrice, totalQty } = useGlobalContext();
    const cartItem = useSelector(state => state.cartItem.cart);
    const user = useSelector(state => state.user);
    const navigate = useNavigate();

    const redirectToCheckoutPage = () => {
        if (!user?._id) {
            toast("Please Login");
            return;
        }

        if (totalPrice < MINIMUM_ORDER_VALUE) {
            const remaining = MINIMUM_ORDER_VALUE - totalPrice;
            toast.error(`Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${remaining.toFixed(2)} more.`, {
                duration: 5000
            });
            return;
        }

        navigate("/checkout");
        if (close) {
            close();
        }
    };

    const savings = notDiscountTotalPrice - totalPrice;

    return (
        <section
            className='bg-black/60 backdrop-blur-sm fixed inset-0 z-50'
            onClick={close}
        >
            <div
                className='bg-white w-full max-w-md min-h-screen max-h-screen ml-auto flex flex-col shadow-2xl'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className='flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center'>
                            <ShoppingCart size={20} className='text-white' />
                        </div>
                        <div>
                            <h2 className='font-bold text-gray-900'>Your Cart</h2>
                            {cartItem[0] && (
                                <p className='text-xs text-gray-500'>{totalQty} {totalQty === 1 ? 'item' : 'items'}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={close}
                        className='w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors'
                        aria-label='Close cart'
                    >
                        <X size={20} className='text-gray-600' />
                    </button>
                </div>

                {/* Cart Content */}
                <div className='flex-1 overflow-auto bg-gray-50'>
                    {cartItem[0] ? (
                        <div className='p-4 space-y-4'>
                            {/* Savings Banner */}
                            {savings > 0 && (
                                <div className='flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl'>
                                    <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                                        <Sparkles size={16} className='text-green-600' />
                                    </div>
                                    <div className='flex-1'>
                                        <p className='text-sm font-medium text-green-800'>You're saving</p>
                                        <p className='text-green-700 font-bold'>{DisplayPriceInRupees(savings)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Cart Items */}
                            <div className='bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100'>
                                {cartItem.map((item) => (
                                    <div key={item?._id + "cartItemDisplay"} className='flex gap-4 p-4'>
                                        <div className='w-16 h-16 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0'>
                                            <img
                                                src={item?.productId?.image[0]}
                                                alt={item?.productId?.name || 'Product'}
                                                className='w-full h-full object-contain p-1'
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm font-medium text-gray-900 line-clamp-2'>{item?.productId?.name}</p>
                                            <p className='text-xs text-gray-500 mt-1'>{item?.productId?.unit}</p>
                                            <p className='font-semibold text-gray-900 mt-1 flex items-center gap-0.5'>
                                                <IndianRupee size={12} />
                                                {pricewithDiscount(item?.productId?.price, item?.productId?.discount).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className='flex-shrink-0'>
                                            <AddToCartButton data={item?.productId} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bill Details */}
                            <div className='bg-white rounded-2xl border border-gray-100 p-4'>
                                <div className='flex items-center gap-2 mb-4'>
                                    <Package size={18} className='text-gray-400' />
                                    <h3 className='font-semibold text-gray-900'>Bill Details</h3>
                                </div>
                                <div className='space-y-3 text-sm'>
                                    <div className='flex justify-between items-center'>
                                        <span className='text-gray-500'>Items total</span>
                                        <div className='flex items-center gap-2'>
                                            {savings > 0 && (
                                                <span className='line-through text-gray-400 text-xs'>{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
                                            )}
                                            <span className='font-medium text-gray-900'>{DisplayPriceInRupees(totalPrice)}</span>
                                        </div>
                                    </div>
                                    <div className='flex justify-between items-center'>
                                        <span className='text-gray-500'>Quantity</span>
                                        <span className='font-medium text-gray-900'>{totalQty} {totalQty === 1 ? 'item' : 'items'}</span>
                                    </div>
                                    <div className='flex justify-between items-center'>
                                        <div className='flex items-center gap-2'>
                                            <Truck size={14} className='text-gray-400' />
                                            <span className='text-gray-500'>Delivery Charge</span>
                                        </div>
                                        <span className='font-medium text-green-600'>FREE</span>
                                    </div>
                                    <div className='border-t border-gray-100 pt-3 mt-3'>
                                        <div className='flex justify-between items-center'>
                                            <span className='font-bold text-gray-900'>Grand Total</span>
                                            <span className='font-bold text-gray-900 flex items-center gap-0.5'>
                                                <IndianRupee size={14} />
                                                {totalPrice.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Minimum Order Warning */}
                            {totalPrice < MINIMUM_ORDER_VALUE && (
                                <div className='bg-amber-50 border border-amber-200 rounded-xl p-4'>
                                    <div className='flex items-start gap-3'>
                                        <AlertCircle size={20} className='text-amber-600 flex-shrink-0 mt-0.5' />
                                        <div>
                                            <p className='text-sm font-semibold text-amber-800'>
                                                Minimum order: ₹{MINIMUM_ORDER_VALUE}
                                            </p>
                                            <p className='text-sm text-amber-700 mt-1'>
                                                Add ₹{(MINIMUM_ORDER_VALUE - totalPrice).toFixed(2)} more to checkout
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='flex flex-col items-center justify-center p-8 min-h-[60vh]'>
                            <img
                                src={imageEmpty}
                                alt="Empty cart"
                                className='w-48 h-48 object-contain mb-6'
                            />
                            <h3 className='text-lg font-bold text-gray-900 mb-2'>Your cart is empty</h3>
                            <p className='text-gray-500 text-sm text-center mb-6'>
                                Looks like you haven't added anything yet. Start shopping!
                            </p>
                            <Link
                                onClick={close}
                                to="/"
                                className='flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors'
                            >
                                <ShoppingBag size={18} />
                                Start Shopping
                            </Link>
                        </div>
                    )}
                </div>

                {/* Checkout Footer - with safe area for mobile */}
                {cartItem[0] && (
                    <div className='p-4 bg-white border-t border-gray-100 safe-bottom'>
                        <button
                            onClick={redirectToCheckoutPage}
                            disabled={totalPrice < MINIMUM_ORDER_VALUE}
                            className={`w-full flex items-center justify-between py-4 px-6 rounded-2xl font-bold transition-all ${
                                totalPrice < MINIMUM_ORDER_VALUE
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                            }`}
                        >
                            <div className='flex items-center gap-1'>
                                <IndianRupee size={18} />
                                <span className='text-lg'>{totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                                <span>Proceed to Checkout</span>
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default DisplayCartItem;
