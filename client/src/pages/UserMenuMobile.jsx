import React from 'react';
import UserMenu from '../components/UserMenu';
import { X, ArrowLeft } from 'lucide-react';

const UserMenuMobile = () => {
    return (
        <section className='bg-gray-50 min-h-screen'>
            {/* Header */}
            <div className='bg-white border-b border-gray-100 sticky top-0 z-10'>
                <div className='flex items-center justify-between p-4'>
                    <button
                        onClick={() => window.history.back()}
                        className='w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors'
                        aria-label='Go back'
                    >
                        <ArrowLeft size={20} className='text-gray-600' />
                    </button>
                    <h1 className='font-bold text-gray-900'>My Account</h1>
                    <button
                        onClick={() => window.history.back()}
                        className='w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors'
                        aria-label='Close'
                    >
                        <X size={20} className='text-gray-600' />
                    </button>
                </div>
            </div>

            {/* User Menu Content */}
            <div className='container mx-auto px-4 py-4 pb-8'>
                <UserMenu />
            </div>
        </section>
    );
};

export default UserMenuMobile;
