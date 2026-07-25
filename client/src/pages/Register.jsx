import { useRef, useState } from 'react'
import toast from 'react-hot-toast';
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";

import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO'

const Register = () => {
    const [data, setData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
    })
    const [otp, setOtp] = useState(["","","","","",""])
    const otpRefs = useRef([])
    const [otpSent, setOtpSent] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))
    const passwordValid = data.password.length >= 8
    const passwordsMatch = data.password === data.confirmPassword && data.confirmPassword.length > 0

    // Validation for customer registration
    const valideValue = Boolean(data.name) && /^\d{10}$/.test(String(data.mobile)) && emailValid && passwordValid && passwordsMatch


    const handleOtpChange = (idx, raw) => {
        const value = raw.replace(/\D/g, '')
        if(!value){
            const next = [...otp]; next[idx] = ""; setOtp(next)
            return
        }
        if(value.length === 1){
            const next = [...otp]; next[idx] = value; setOtp(next)
            if(idx < otp.length - 1) otpRefs.current[idx+1]?.focus()
            return
        }
        const digits = value.slice(0, otp.length)
        const next = [...otp]
        for(let i=0;i<digits.length;i++){
            const t = idx + i
            if(t < otp.length) next[t] = digits[i]
        }
        setOtp(next)
        const last = Math.min(idx + digits.length - 1, otp.length - 1)
        otpRefs.current[last]?.focus()
    }

    const handleOtpKeyDown = (idx, e) => {
        if(e.key === 'Backspace'){
            if(otp[idx]){
                const next = [...otp]; next[idx] = ""; setOtp(next)
            } else if(idx > 0){
                otpRefs.current[idx-1]?.focus()
            }
        }
        if(e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx-1]?.focus()
        if(e.key === 'ArrowRight' && idx < otp.length - 1) otpRefs.current[idx+1]?.focus()
    }

    const handleOtpPaste = (idx, e) => {
        const text = e.clipboardData.getData('text')
        if(/\d/.test(text)){
            e.preventDefault()
            handleOtpChange(idx, text)
        }
    }

    const handleSubmit = async(e)=>{
        e.preventDefault()
        try {
            // Customer registration - OTP-based
            if(!otpSent){
                const response = await Axios({
                    ...SummaryApi.sendOtp,
                    data : { mobile : data.mobile, intent : 'register', email : data.email }
                })
                if(response.data.success){
                    toast.success(response.data.message)
                    setOtpSent(true)
                } else {
                    toast.error(response.data.message)
                }
                return
            }
            
            const code = otp.join("")
            const response = await Axios({
                ...SummaryApi.verifyOtp,
                data : { mobile : data.mobile, otp : code, name : data.name, email : data.email || null, password : data.password }
            })
            if(response.data.error){
                toast.error(response.data.message)
                return
            }
            if(response.data.success){
                toast.success("Registered and logged in")
                localStorage.setItem('accesstoken',response.data.data.accesstoken)
                localStorage.setItem('refreshToken',response.data.data.refreshToken)
                navigate("/")
            }

        } catch (error) {
            AxiosToastError(error)
        }
    }
    return (
        <section className='w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4 py-8'>
            <SEO
              title="Create Account - Customer Registration"
              description="Create your Quickart account for easy ordering, fast checkout, and real-time delivery tracking. Register now!"
              noindex={true}
            />
            <div className='bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden'>
                {/* Header Section */}
                <div className='bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-center'>
                    <h1 className='text-3xl font-bold text-white mb-2'>Join Quickart</h1>
                    <p className='text-red-100 text-sm'>Create your account to get started</p>
                </div>

                <div className='px-8 py-6'>
                    <form className='space-y-5' onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor='name' className='block text-sm font-semibold text-gray-700 mb-2'>Full Name</label>
                            <input
                                type='text'
                                id='name'
                                autoFocus
                                className={`w-full px-4 py-3 bg-white border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800 ${data.name ? 'border-green-400 focus:border-green-500' : 'border-gray-200 focus:border-red-600'}`}
                                name='name'
                                value={data.name}
                                onChange={handleChange}
                                placeholder='John Doe'
                            />
                            {!data.name && <p className='text-xs text-red-500 mt-1'>Name is required</p>}
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-gray-700 mb-2'>Mobile Number</label>
                            <input
                                type='tel'
                                className={`w-full px-4 py-3 bg-white border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800 ${/^\d{10}$/.test(data.mobile) ? 'border-green-400 focus:border-green-500' : 'border-gray-200 focus:border-red-600'}`}
                                name='mobile'
                                value={data.mobile}
                                onChange={(e)=> setData(prev=> ({...prev, mobile: e.target.value.replace(/\D/g,'')}))}
                                placeholder='9876543210'
                                maxLength={10}
                            />
                            {data.mobile && !/^\d{10}$/.test(data.mobile) && <p className='text-xs text-red-500 mt-1'>Enter a valid 10-digit mobile number</p>}
                            {!data.mobile && <p className='text-xs text-red-500 mt-1'>Mobile number is required</p>}
                        </div>
                        <div>
                            <label htmlFor='email' className='block text-sm font-semibold text-gray-700 mb-2'>Email Address</label>
                            <input
                                type='email'
                                id='email'
                                className={`w-full px-4 py-3 bg-white border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800 ${emailValid ? 'border-green-400 focus:border-green-500' : 'border-gray-200 focus:border-red-600'}`}
                                name='email'
                                value={data.email}
                                onChange={handleChange}
                                placeholder='yourname@example.com'
                                required
                            />
                            {data.email && !emailValid && <p className='text-xs text-red-500 mt-1'>Enter a valid email address (e.g. name@example.com)</p>}
                            {!data.email && <p className='text-xs text-red-500 mt-1'>Email is required</p>}
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor='password' className='block text-sm font-semibold text-gray-700 mb-2'>Password</label>
                            <div className='relative'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id='password'
                                    className={`w-full px-4 py-3 pr-12 bg-white border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800 ${passwordValid ? 'border-green-400 focus:border-green-500' : 'border-gray-200 focus:border-red-600'}`}
                                    name='password'
                                    value={data.password}
                                    onChange={handleChange}
                                    placeholder='Create a password'
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors'
                                >
                                    {showPassword ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
                                </button>
                            </div>
                            {data.password && !passwordValid && <p className='text-xs text-red-500 mt-1'>Password must be at least 8 characters</p>}
                            {!data.password && <p className='text-xs text-red-500 mt-1'>Password is required</p>}
                        </div>

                        {/* Confirm Password field */}
                        <div>
                            <label htmlFor='confirmPassword' className='block text-sm font-semibold text-gray-700 mb-2'>Confirm Password</label>
                            <div className='relative'>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id='confirmPassword'
                                    className={`w-full px-4 py-3 pr-12 bg-white border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-100 transition-all duration-300 text-gray-800 ${passwordsMatch ? 'border-green-400 focus:border-green-500' : 'border-gray-200 focus:border-red-600'}`}
                                    name='confirmPassword'
                                    value={data.confirmPassword}
                                    onChange={handleChange}
                                    placeholder='Confirm your password'
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
                                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors'
                                >
                                    {showConfirmPassword ? <FaRegEye size={20} /> : <FaRegEyeSlash size={20} />}
                                </button>
                            </div>
                            {data.confirmPassword && !passwordsMatch && <p className='text-xs text-red-500 mt-1'>Passwords do not match</p>}
                            {!data.confirmPassword && <p className='text-xs text-red-500 mt-1'>Please confirm your password</p>}
                        </div>

                        {/* OTP field */}
                        {otpSent && (
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Enter OTP</label>
                                <div className='flex gap-2 justify-between'>
                                    {otp.map((d,idx)=> (
                                        <input
                                            key={idx}
                                            ref={el => otpRefs.current[idx] = el}
                                            value={otp[idx]}
                                            onChange={(e)=> handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e)=> handleOtpKeyDown(idx, e)}
                                            onPaste={(e)=> handleOtpPaste(idx, e)}
                                            inputMode='numeric'
                                            autoComplete='one-time-code'
                                            maxLength={1}
                                            className='w-full h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition-all duration-300'
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            disabled={!valideValue} 
                            className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transition-all duration-300 ${
                                valideValue 
                                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-xl transform hover:scale-[1.02]' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {otpSent ? '✓ Verify & Create Account' : 'Send OTP →'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className='mt-8 pt-6 border-t border-gray-200 text-center'>
                        <p className='text-gray-600'>
                            Already have an account? <Link to={"/login"} className='font-bold text-red-600 hover:text-red-700 transition-colors'>Sign In</Link>
                        </p>
                        <p className='text-gray-500 text-sm mt-3'>
                            Want to deliver with us? <Link to={"/register-rider"} className='font-bold text-green-600 hover:text-green-700 transition-colors'>Become a Rider</Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Register
