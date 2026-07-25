import React, { useEffect, useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [data,setData] = useState({
    email : "",
    newPassword : "",
    confirmPassword : ""
  })
  const [showPassword,setShowPassword] = useState(false)
  const [showConfirmPassword,setShowConfirmPassword] = useState(false)

  const valideValue = Object.values(data).every(el => el)

  useEffect(()=>{
    if(!(location?.state?.data?.success)){
        navigate("/")
    }

    if(location?.state?.email){
        setData((preve)=>{
            return{
                ...preve,
                email : location?.state?.email
            }
        })
    }
  },[])

  const handleChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

  console.log("data reset password",data)

  const handleSubmit = async(e)=>{
    e.preventDefault()

    ///optional 
    if(data.newPassword !== data.confirmPassword){
        toast.error("New password and confirm password must be same.")
        return
    }

    try {
        const response = await Axios({
            ...SummaryApi.resetPassword, //change
            data : data
        })
        
        if(response.data.error){
            toast.error(response.data.message)
        }

        if(response.data.success){
            toast.success(response.data.message)
            navigate("/login")
            setData({
                email : "",
                newPassword : "",
                confirmPassword : ""
            })
            
        }

    } catch (error) {
        AxiosToastError(error)
    }



}

  return (
    <section className='w-full container mx-auto px-2'>
            <div className='bg-white my-4 w-full max-w-lg mx-auto rounded-xl shadow-lg border-2 border-gray-100 p-7'>
                <h1 className='text-2xl font-bold text-red-700 mb-2'>Reset Password</h1>
                <p className='text-gray-600 mb-4'>Create a new secure password for your account</p>
                <form className='grid gap-4 py-4' onSubmit={handleSubmit}>
                    <div className='grid gap-1'>
                        <label htmlFor='newPassword' className='font-semibold text-gray-700'>New Password :</label>
                        <div className='bg-white p-2 border-2 border-gray-200 rounded-lg flex items-center focus-within:border-red-600 focus-within:shadow-lg focus-within:shadow-red-500/20 transition-all duration-300'>
                            <input
                                type={showPassword ? "text" : "password"}
                                id='password'
                                className='w-full outline-none'
                                name='newPassword'
                                value={data.newPassword}
                                onChange={handleChange}
                                placeholder='Enter your new password'
                            />
                            <div onClick={() => setShowPassword(preve => !preve)} className='cursor-pointer text-gray-600 hover:text-red-600 transition-colors'>
                                {
                                    showPassword ? (
                                        <FaRegEye />
                                    ) : (
                                        <FaRegEyeSlash />
                                    )
                                }
                            </div>
                        </div>
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='confirmPassword' className='font-semibold text-gray-700'>Confirm Password :</label>
                        <div className='bg-white p-2 border-2 border-gray-200 rounded-lg flex items-center focus-within:border-red-600 focus-within:shadow-lg focus-within:shadow-red-500/20 transition-all duration-300'>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id='password'
                                className='w-full outline-none'
                                name='confirmPassword'
                                value={data.confirmPassword}
                                onChange={handleChange}
                                placeholder='Enter your confirm password'
                            />
                            <div onClick={() => setShowConfirmPassword(preve => !preve)} className='cursor-pointer text-gray-600 hover:text-red-600 transition-colors'>
                                {
                                    showConfirmPassword ? (
                                        <FaRegEye />
                                    ) : (
                                        <FaRegEyeSlash />
                                    )
                                }
                            </div>
                        </div>
                    </div>
             
                    <button disabled={!valideValue} className={` ${valideValue ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 hover:scale-105 shadow-lg hover:shadow-xl" : "bg-gray-500" } text-white py-3 rounded-lg font-semibold my-3 tracking-wide transition-all duration-300`}>Change Password</button>

                </form>

                <p className='text-center text-gray-600'>
                    Already have account? <Link to={"/login"} className='font-bold text-red-600 hover:text-red-700 transition-colors'>Login</Link>
                </p>
            </div>
        </section>
  )
}

export default ResetPassword
