import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Divider from './Divider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { logout } from '../store/userSlice'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { HiOutlineExternalLink } from "react-icons/hi";
import { FaUpload, FaBox, FaStar, FaShoppingCart, FaShoppingBag, FaMapMarkerAlt, FaFolder, FaTags } from "react-icons/fa";
import isAdmin from '../utils/isAdmin'

const UserMenu = ({close, onItemClick}) => {
   const user = useSelector((state)=> state.user)
   const dispatch = useDispatch()
   const navigate = useNavigate()

   const handleLogout = async()=>{
        try {
          const response = await Axios({
             ...SummaryApi.logout
          })
          console.log("logout",response)
          if(response.data.success){
            if(close){
              close()
            }
            if(onItemClick){
              onItemClick()
            }
            dispatch(logout())
            localStorage.clear()
            toast.success(response.data.message)
            navigate("/")
          }
        } catch (error) {
          console.log(error)
          AxiosToastError(error)
        }
   }

   const handleClose = ()=>{
      if(close){
        close()
      }
      if(onItemClick){
        onItemClick()
      }
   }
  return (
    <div className='min-w-[260px]'>
        <div className='font-bold text-lg text-red-800 mb-1'>My Account</div>
        <div className='text-sm flex items-center gap-2 mb-3'>
          <span className='max-w-52 text-ellipsis line-clamp-1 text-gray-700 font-medium'>
            {user.name || user.mobile} 
            {user.role === "ADMIN" && (
              <span className='ml-1 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 px-2 py-0.5 rounded-full'>Admin</span>
            )}
          </span>
          <Link onClick={handleClose} to={"/dashboard/profile"} className='hover:text-red-600 text-red-800 transition-colors duration-300'>
            <HiOutlineExternalLink size={16}/>
          </Link>
        </div>

        <Divider/>

        <div className='text-sm grid gap-1 mt-3'>
            {/* Delivery Agent Menu */}
            {
              user.role === "DELIVERY_AGENT" && (
                <>
                  <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-2'>Delivery Partner</div>
                  <Link onClick={handleClose} to={"/delivery"} className='px-3 py-2 hover:bg-green-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-green-700 font-medium'>
                    🏠 Dashboard
                  </Link>
                  <Link onClick={handleClose} to={"/delivery/orders"} className='px-3 py-2 hover:bg-green-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-green-700 font-medium'>
                    📦 My Deliveries
                  </Link>
                  <Link onClick={handleClose} to={"/delivery/wallet"} className='px-3 py-2 hover:bg-green-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-green-700 font-medium'>
                    💰 Wallet & Earnings
                  </Link>
                  <Divider/>
                </>
              )
            }
            {
              isAdmin(user.role) && (
                <>
                  <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 px-2'>Admin Panel</div>
                  <Link onClick={handleClose} to={"/dashboard/category"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    <FaTags className='inline mr-2' /> Category
                  </Link>
                  <Link onClick={handleClose} to={"/dashboard/subcategory"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    <FaFolder className='inline mr-2' /> Sub Category
                  </Link>
                  <Link onClick={handleClose} to={"/dashboard/upload-product"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    <FaUpload className='inline mr-2' /> Upload Product
                  </Link>
                  <Link onClick={handleClose} to={"/dashboard/product"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    <FaBox className='inline mr-2' /> Products
                  </Link>
                  {/* HIDDEN: Reviews feature temporarily disabled */}
                  {/* <Link onClick={handleClose} to={"/dashboard/reviews"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    <FaStar className='inline mr-2' /> Reviews
                  </Link> */}
                  <Link onClick={handleClose} to={"/dashboard/admin-orders"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    <FaShoppingCart className='inline mr-2' /> Order Management
                  </Link>
                  <Link onClick={handleClose} to={"/dashboard/agents"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    🚚 Delivery Agents
                  </Link>
                  <Link onClick={handleClose} to={"/dashboard/payouts"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    💰 Payouts
                  </Link>
                  <Link onClick={handleClose} to={"/dashboard/agent-analytics"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    📊 Agent Analytics
                  </Link>
                  <Link onClick={handleClose} to={"/dashboard/rider-tracking"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
                    📍 Live Rider Tracking
                  </Link>
                  <Divider/>
                </>
              )
            }

            <Link onClick={handleClose} to={"/dashboard/myorders"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
              <FaShoppingBag className='inline mr-2' /> My Orders
            </Link>

            <Link onClick={handleClose} to={"/dashboard/address"} className='px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-gray-700 hover:text-red-700 font-medium'>
              <FaMapMarkerAlt className='inline mr-2' /> Saved Addresses
            </Link>

            <Divider/>

            <button onClick={handleLogout} className='text-left px-3 py-2 hover:bg-red-50 rounded-lg transition-all duration-300 text-red-600 hover:text-red-700 font-semibold hover:shadow-md mt-1'>
              🚪 Log Out
            </button>

        </div>
    </div>
  )
}

export default UserMenu
