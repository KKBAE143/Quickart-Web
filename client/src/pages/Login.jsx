import { useState } from 'react'
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa6";
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import fetchUserDetails from '../utils/fetchUserDetails';
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../store/userSlice';

const Login = () => {
    const [data, setData] = useState({
        email: "",
        password: "",
    })
    const [useMobile, setUseMobile] = useState(true)
    const [mobile, setMobile] = useState("")
    const [otp, setOtp] = useState(["","","","","",""])
    const [otpSent, setOtpSent] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const handleChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const valideValue = Object.values(data).every(el => el)


    const handleSubmit = async(e)=>{
        e.preventDefault()

        try {
            if(useMobile){
                if(!otpSent){
                    const response = await Axios({
                        ...SummaryApi.sendOtp,
                        data : { mobile, intent : 'login' }
                    })
                    if(response.data.success){
                        toast.success(response.data.message)
                        setOtpSent(true)
                    }else{
                        toast.error(response.data.message)
                    }
                    return
                }
                const code = otp.join("")
                const response = await Axios({
                    ...SummaryApi.verifyOtp,
                    data : { mobile, otp : code }
                })
                if(response.data.error){
                    toast.error(response.data.message)
                    return
                }
                if(response.data.success){
                    toast.success(response.data.message)
                    localStorage.setItem('accesstoken',response.data.data.accesstoken)
                    localStorage.setItem('refreshToken',response.data.data.refreshToken)
                    const userDetails = await fetchUserDetails()
                    dispatch(setUserDetails(userDetails.data))
                    setMobile("")
                    setOtp(["","","","","",""])
                    
                    // Redirect based on user role
                    if (userDetails.data && userDetails.data.role === 'ADMIN') {
                        navigate("/dashboard/category")
                    } else if (userDetails.data && userDetails.data.role === 'DELIVERY_AGENT') {
                        navigate("/delivery")
                    } else {
                        navigate("/")
                    }
                }
                return
            }
            // Use standard login endpoint
            const response = await Axios({
                ...SummaryApi.login,
                data : data
            })
            
            if(response.data.error){
                toast.error(response.data.message)
            }

            if(response.data.success){
                toast.success(response.data.message)
                
                const accessToken = response.data.data.accesstoken
                const refreshToken = response.data.data.refreshToken
                
                localStorage.setItem('accesstoken', accessToken)
                localStorage.setItem('refreshToken', refreshToken)

                const userDetails = await fetchUserDetails()
                const userData = userDetails?.data
                
                dispatch(setUserDetails(userData))

                setData({
                    email : "",
                    password : "",
                })
                
                // Redirect based on user role
                if (userData && userData.role === 'ADMIN') {
                    navigate("/dashboard/category")
                } else if (userData && userData.role === 'DELIVERY_AGENT') {
                    navigate("/delivery")
                } else {
                    navigate("/")
                }
            }

        } catch (error) {
            AxiosToastError(error)
        }



    }
    return (
        <section className='w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4 py-8'>
            <div className='bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden'>
                {/* Header Section */}
                <div className='bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-center'>
                    <h1 className='text-3xl font-bold text-white mb-2'>Quickart</h1>
                    <p className='text-red-100 text-sm'>Sign in to continue</p>
                </div>

                <div className='px-8 py-6'>
                    {/* Login Method Toggle */}
                    <div className='mb-6'>
                        <label className='block text-sm font-semibold text-gray-700 mb-3'>Login Method</label>
                        <div className='grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg'>
                            <button 
                                type='button' 
                                onClick={()=>setUseMobile(true)} 
                                className={`py-2.5 rounded-md font-semibold text-sm transition-all duration-300 ${useMobile ? 'bg-white text-red-600 shadow-md' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                Mobile OTP
                            </button>
                            <button 
                                type='button' 
                                onClick={()=>setUseMobile(false)} 
                                className={`py-2.5 rounded-md font-semibold text-sm transition-all duration-300 ${!useMobile ? 'bg-white text-red-600 shadow-md' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                Email Login
                            </button>
                        </div>
                    </div>

                    {/* Mobile OTP Form */}
                    {useMobile ? (
                        <form className='space-y-5' onSubmit={handleSubmit}>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Mobile Number</label>
                                <input
                                    type='tel'
                                    className={`w-full px-4 py-3 bg-white border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800 ${/^\d{10}$/.test(mobile) ? 'border-green-400 focus:border-green-500' : 'border-gray-200 focus:border-red-600'}`}
                                    value={mobile}
                                    onChange={(e)=>setMobile(e.target.value.replace(/\D/g,''))}
                                    placeholder='Enter 10-digit mobile'
                                    maxLength={10}
                                />
                                {mobile && !/^\d{10}$/.test(mobile) && <p className='text-xs text-red-500 mt-1'>Enter a valid 10-digit mobile number</p>}
                                {!mobile && <p className='text-xs text-red-500 mt-1'>Mobile number is required</p>}
                            </div>
                            {otpSent && (
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Enter OTP</label>
                                    <div className='flex gap-2 justify-between'>
                                        {otp.map((d,idx)=> (
                                            <input 
                                                key={idx} 
                                                value={otp[idx]} 
                                                onChange={(e)=>{
                                                    const v = e.target.value.replace(/\D/g,'').slice(0,1)
                                                    const next = [...otp]; next[idx]=v; setOtp(next)
                                                }} 
                                                className='w-full h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition-all duration-300' 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button 
                                disabled={!/^\d{10}$/.test(mobile)}
                                className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transition-all duration-300 ${
                                    /^\d{10}$/.test(mobile)
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-xl transform hover:scale-[1.02]'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {otpSent ? '✓ Verify & Login' : 'Send OTP →'}
                            </button>
                        </form>
                    ) : (
                        <form className='space-y-5' onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor='email' className='block text-sm font-semibold text-gray-700 mb-2'>Email Address</label>
                                <input
                                    type='email'
                                    id='email'
                                    className='w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800'
                                    name='email'
                                    value={data.email}
                                    onChange={handleChange}
                                    placeholder='yourname@example.com'
                                />
                            </div>
                            <div>
                                <label htmlFor='password' className='block text-sm font-semibold text-gray-700 mb-2'>Password</label>
                                <div className='relative'>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id='password'
                                        className='w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800'
                                        name='password'
                                        value={data.password}
                                        onChange={handleChange}
                                        placeholder='Enter your password'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setShowPassword(prev => !prev)} 
                                        className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors'
                                    >
                                        {showPassword ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
                                    </button>
                                </div>
                                <Link to={'/forgot-password'} className='block mt-2 text-sm text-red-600 hover:text-red-700 font-semibold transition-colors text-right'>
                                    Forgot password?
                                </Link>
                            </div>
                            <button 
                                disabled={!valideValue} 
                                className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transition-all duration-300 ${
                                    valideValue 
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-xl transform hover:scale-[1.02]' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Sign In →
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className='mt-8 pt-6 border-t border-gray-200 text-center'>
                        <p className='text-gray-600'>
                            Don&apos;t have an account? <Link to={'/register'} className='font-bold text-red-600 hover:text-red-700 transition-colors'>Create Account</Link>
                        </p>
                        <p className='text-gray-500 text-sm mt-3'>
                            Want to deliver with us? <Link to={'/register-rider'} className='font-bold text-red-600 hover:text-red-700 transition-colors'>Become a Rider</Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Login

