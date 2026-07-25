import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { setUserDetails } from './store/userSlice';
import { setAllCategory,setAllSubCategory,setLoadingCategory } from './store/productSlice';
import { useDispatch, useSelector } from 'react-redux';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import { handleAddItemCart } from './store/cartProduct'
import GlobalProvider from './provider/GlobalProvider';
import { SocketProvider } from './provider/SocketProvider';
import { GoogleMapsProvider } from './provider/GoogleMapsProvider';
import { FaCartShopping } from "react-icons/fa6";
import CartMobileLink from './components/CartMobile';

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector(state => state.user)

  // Check if we're on a delivery route
  const isDeliveryRoute = location.pathname.startsWith('/delivery')

  // Check if we're on a dashboard route
  const isDashboardRoute = location.pathname.startsWith('/dashboard')

  // Check if we're on track order page (hide footer)
  const isTrackOrderPage = location.pathname.startsWith('/track-order')

  // Check if user is a delivery agent
  const isDeliveryAgent = user?.role === 'DELIVERY_AGENT'

  const fetchUser = async()=>{
      const userData = await fetchUserDetails()
      // Only dispatch if userData is valid
      if(userData && userData.data){
        dispatch(setUserDetails(userData.data))
      }
  }

  const fetchCategory = async()=>{
    try {
        dispatch(setLoadingCategory(true))
        const response = await Axios({
            ...SummaryApi.getCategory
        })
        const { data : responseData } = response

        if(responseData.success){
           dispatch(setAllCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name))))
        }
    } catch (error) {

    }finally{
      dispatch(setLoadingCategory(false))
    }
  }

  const fetchSubCategory = async()=>{
    try {
        const response = await Axios({
            ...SummaryApi.getSubCategory
        })
        const { data : responseData } = response

        if(responseData.success){
           dispatch(setAllSubCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name))))
        }
    } catch (error) {

    }finally{
    }
  }



  useEffect(()=>{
    fetchUser()
    fetchCategory()
    fetchSubCategory()
    // fetchCartItem()
  },[])

  // For delivery agents on delivery routes, show minimal layout (no shopping header/footer)
  if (isDeliveryAgent && isDeliveryRoute) {
    return (
      <GoogleMapsProvider>
        <SocketProvider>
          <GlobalProvider>
            <main className='min-h-screen'>
                <Outlet/>
            </main>
            <Toaster/>
          </GlobalProvider>
        </SocketProvider>
      </GoogleMapsProvider>
    )
  }

  // For dashboard routes, show minimal layout (sidebar handles navigation)
  if (isDashboardRoute) {
    return (
      <GoogleMapsProvider>
        <SocketProvider>
          <GlobalProvider>
            <main className='min-h-screen'>
                <Outlet/>
            </main>
            <Toaster/>
          </GlobalProvider>
        </SocketProvider>
      </GoogleMapsProvider>
    )
  }

  return (
    <GoogleMapsProvider>
      <SocketProvider>
        <GlobalProvider>
          <Header/>
          <main className='min-h-[78vh] pb-20 lg:pb-0'>
              <Outlet/>
          </main>
          {!isTrackOrderPage && <Footer/>}
          <Toaster/>
          {
            location.pathname !== '/checkout' && !isDeliveryRoute && (
              <CartMobileLink/>
            )
          }
        </GlobalProvider>
      </SocketProvider>
    </GoogleMapsProvider>
  )
}

export default App
