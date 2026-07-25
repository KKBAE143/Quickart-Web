import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    XCircle,
    Home,
    RefreshCw,
    ShoppingCart,
    HelpCircle,
    Phone,
    Mail,
    ArrowLeft,
    AlertTriangle
} from 'lucide-react';

const Cancel = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const errorMessage = location?.state?.message || "Your payment was cancelled or could not be processed.";
    const orderId = location?.state?.orderId;

    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4'>
            <div className='max-w-lg mx-auto'>
                {/* Cancel Card */}
                <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center'>
                    {/* Icon */}
                    <div className='flex justify-center mb-6'>
                        <div className='relative'>
                            <div className='w-24 h-24 bg-red-50 rounded-full flex items-center justify-center'>
                                <XCircle size={56} className='text-red-500' />
                            </div>
                            <div className='absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center'>
                                <AlertTriangle size={16} className='text-white' />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                        Payment Cancelled
                    </h1>
                    <p className='text-gray-500 mb-6'>
                        {errorMessage}
                    </p>

                    {/* Order ID if available */}
                    {orderId && (
                        <div className='bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 inline-block mb-6'>
                            <p className='text-xs text-gray-500 uppercase tracking-wider'>Order Reference</p>
                            <p className='text-gray-900 font-mono font-semibold'>{orderId}</p>
                        </div>
                    )}

                    {/* Info Message */}
                    <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6'>
                        <div className='flex items-start gap-3'>
                            <AlertTriangle size={20} className='text-amber-600 flex-shrink-0 mt-0.5' />
                            <div className='text-left'>
                                <p className='text-sm text-amber-800 font-medium'>Don't worry!</p>
                                <p className='text-sm text-amber-700 mt-1'>
                                    Your cart items are still saved. You can try again with a different payment method or contact support if you need help.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='space-y-3'>
                        <button
                            onClick={() => navigate(-1)}
                            className='w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors'
                        >
                            <RefreshCw size={18} />
                            Try Again
                        </button>

                        <Link
                            to="/cart"
                            className='w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors'
                        >
                            <ShoppingCart size={18} />
                            Back to Cart
                        </Link>

                        <Link
                            to="/"
                            className='w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors'
                        >
                            <ArrowLeft size={16} />
                            Return to Home
                        </Link>
                    </div>
                </div>

                {/* Help Section */}
                <div className='mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
                    <div className='flex items-center gap-3 mb-4'>
                        <div className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center'>
                            <HelpCircle size={20} className='text-gray-600' />
                        </div>
                        <div>
                            <h2 className='font-semibold text-gray-900'>Need Help?</h2>
                            <p className='text-sm text-gray-500'>Our support team is here for you</p>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        <a
                            href="tel:+911234567890"
                            className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors'
                        >
                            <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100'>
                                <Phone size={18} className='text-gray-600' />
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Call us</p>
                                <p className='font-semibold text-gray-900'>+91 123 456 7890</p>
                            </div>
                        </a>

                        <a
                            href="mailto:support@quickart.com"
                            className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors'
                        >
                            <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100'>
                                <Mail size={18} className='text-gray-600' />
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Email us</p>
                                <p className='font-semibold text-gray-900'>support@quickart.com</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Common Issues */}
                <div className='mt-6 bg-gray-50 rounded-2xl border border-gray-200 p-6'>
                    <h3 className='font-semibold text-gray-900 mb-4'>Common reasons for payment failure:</h3>
                    <ul className='space-y-2 text-sm text-gray-600'>
                        <li className='flex items-start gap-2'>
                            <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0'></span>
                            <span>Insufficient funds in your account</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0'></span>
                            <span>Card expired or incorrect card details</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0'></span>
                            <span>Network connectivity issues</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0'></span>
                            <span>Transaction timeout - please try again</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Cancel;
