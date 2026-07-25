import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import isAdmin from '../utils/isAdmin'
import { FaLock, FaHome, FaArrowLeft } from 'react-icons/fa'

const AdminPermision = ({children}) => {
    const user = useSelector(state => state.user)
    const navigate = useNavigate()

    // Check if user is admin
    if (isAdmin(user.role)) {
        return <>{children}</>
    }

    // Access Denied UI for non-admin users
    return (
        <div className='min-h-[60vh] flex items-center justify-center p-4'>
            <div className='bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden'>
                {/* Header */}
                <div className='bg-gradient-to-r from-red-600 to-red-700 p-6 text-center'>
                    <div className='w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <FaLock className='text-white text-3xl' />
                    </div>
                    <h1 className='text-2xl font-bold text-white'>Access Denied</h1>
                </div>

                {/* Body */}
                <div className='p-6 text-center'>
                    <p className='text-gray-600 mb-6'>
                        Sorry, you don't have permission to access this page.
                        This area is restricted to administrators only.
                    </p>

                    <div className='space-y-3'>
                        <button
                            onClick={() => navigate(-1)}
                            className='w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium'
                        >
                            <FaArrowLeft />
                            Go Back
                        </button>

                        <Link
                            to='/'
                            className='w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all font-medium'
                        >
                            <FaHome />
                            Go to Home
                        </Link>
                    </div>

                    {/* User info */}
                    {user?.name && (
                        <p className='mt-6 text-sm text-gray-400'>
                            Logged in as: <span className='font-medium'>{user.name}</span>
                            {user.role && <span className='ml-1'>({user.role})</span>}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminPermision
