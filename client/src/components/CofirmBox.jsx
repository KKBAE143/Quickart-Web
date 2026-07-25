import React from 'react'
import { IoClose } from "react-icons/io5";

const CofirmBox = ({cancel,confirm,close}) => {
  return (
    <div className='fixed top-0 bottom-0 right-0 left-0 z-50 bg-neutral-800 bg-opacity-70 p-4 flex justify-center items-center animate-fadeIn'>
      <div className='bg-white w-full max-w-md p-6 rounded-xl shadow-2xl border-2 border-gray-100'>
           <div className='flex justify-between items-center gap-3 mb-4'>
                <h1 className='font-bold text-xl text-red-700'>Permanent Delete</h1>
                <button onClick={close} className='hover:bg-red-50 p-1 rounded-lg transition-all duration-300 text-gray-600 hover:text-red-600'>
                    <IoClose size={25} />
                </button>
           </div>
           <p className='my-4 text-gray-700'>Are you sure you want to permanently delete this item? This action cannot be undone.</p>
           <div className='w-fit ml-auto flex items-center gap-3 mt-6'>
                <button onClick={cancel} className='px-6 py-2 border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-all duration-300 hover:scale-105'>Cancel</button>
                <button onClick={confirm} className='px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'>Confirm Delete</button>
           </div>
      </div>
    </div>
  )
}

export default CofirmBox
