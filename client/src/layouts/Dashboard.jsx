import React, { useState } from 'react'
import UserMenu from '../components/UserMenu'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { HiMenuAlt3 } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'

const Dashboard = () => {
  const user = useSelector(state => state.user)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  console.log("user dashboard",user)
  return (
    <section className='bg-white min-h-screen'>
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className='lg:hidden fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110'
        >
          {showMobileMenu ? <IoClose size={24} /> : <HiMenuAlt3 size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div 
            className='lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40'
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        <div className='container mx-auto p-3 md:p-4 lg:p-6 grid lg:grid-cols-[250px,1fr]'>
                {/**Desktop Menu */}
                <div className='py-4 sticky top-24 max-h-[calc(100vh-96px)] overflow-y-auto hidden lg:block border-r'>
                    <UserMenu/>
                </div>

                {/**Mobile Menu Drawer */}
                <div className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
                    <div className='p-4 border-b bg-gradient-to-r from-red-50 to-white'>
                      <h2 className='text-xl font-bold text-red-700'>Menu</h2>
                    </div>
                    <div className='p-4'>
                      <UserMenu onItemClick={() => setShowMobileMenu(false)} />
                    </div>
                </div>

                {/**Content Area */}
                <div className='bg-white min-h-[75vh] px-2 md:px-4'>
                    <Outlet/>
                </div>
        </div>
    </section>
  )
}

export default Dashboard
