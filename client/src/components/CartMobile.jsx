import React from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { FaCartShopping } from 'react-icons/fa6'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link } from 'react-router-dom'
import { FaCaretRight } from "react-icons/fa";
import { useSelector } from 'react-redux'

const CartMobileLink = () => {
    const { totalPrice, totalQty } = useGlobalContext()
    const cartItem = useSelector(state => state.cartItem.cart)

  return (
    <>
        {
            cartItem[0] && (
            <div className='fixed bottom-0 left-0 right-0 p-3 z-50 lg:hidden'>
            <div className='bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 rounded-xl text-white text-sm flex items-center justify-between gap-3 shadow-xl'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-white bg-opacity-20 rounded-lg w-fit'>
                            <FaCartShopping size={18}/>
                        </div>
                        <div className='text-sm'>
                                <p className='font-semibold'>{totalQty} items</p>
                                <p className='font-bold'>{DisplayPriceInRupees(totalPrice)}</p>
                        </div>
                    </div>

                    <Link to={"/cart"} className='flex items-center gap-1 bg-white text-red-600 px-3 py-2 rounded-lg font-semibold hover:scale-105 transition-transform duration-300'>
                        <span className='text-sm'>View Cart</span>
                        <FaCaretRight/>
                    </Link>
                </div>
            </div>
            )
        }
    </>
    
  )
}

export default CartMobileLink
