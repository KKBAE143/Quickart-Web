import React, { useEffect, useRef, useState } from 'react'
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa6";
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const OtpVerification = () => {
    const [data, setData] = useState(["","","","","",""])
    const navigate = useNavigate()
    const inputRef = useRef([])
    const location = useLocation()

    console.log("location",location)

    useEffect(()=>{
        if(!location?.state?.email){
            navigate("/forgot-password")
        }
    },[])

    const valideValue = data.every(el => el)

    const handleSubmit = async(e)=>{
        e.preventDefault()

        try {
            const response = await Axios({
                ...SummaryApi.forgot_password_otp_verification,
                data : {
                    otp : data.join(""),
                    email : location?.state?.email
                }
            })
            
            if(response.data.error){
                toast.error(response.data.message)
            }

            if(response.data.success){
                toast.success(response.data.message)
                setData(["","","","","",""])
                navigate("/reset-password",{
                    state : {
                        data : response.data,
                        email : location?.state?.email
                    }
                })
            }

        } catch (error) {
            console.log('error',error)
            AxiosToastError(error)
        }



    }

    return (
        <section className='w-full container mx-auto px-2'>
            <div className='bg-white my-4 w-full max-w-lg mx-auto rounded-xl shadow-lg border-2 border-gray-100 p-7'>
                <h1 className='text-2xl font-bold text-red-700 mb-2'>Verify OTP</h1>
                <p className='text-gray-600 mb-4'>Enter the 6-digit code sent to your email</p>
                <form className='grid gap-4 py-4' onSubmit={handleSubmit}>
                    <div className='grid gap-1'>
                        <label htmlFor='otp' className='font-semibold text-gray-700'>Enter Your OTP :</label>
                        <div className='flex items-center gap-2 justify-between mt-3'>
                            {
                                data.map((element,index)=>{
                                    return(
                                        <input
                                            key={"otp"+index}
                                            type='text'
                                            id='otp'
                                            ref={(ref)=>{
                                                inputRef.current[index] = ref
                                                return ref 
                                            }}
                                            value={data[index]}
                                            onChange={(e)=>{
                                                const value =  e.target.value
                                                console.log("value",value)

                                                const newData = [...data]
                                                newData[index] = value
                                                setData(newData)

                                                if(value && index < 5){
                                                    inputRef.current[index+1].focus()
                                                }


                                            }}
                                            maxLength={1}
                                            className='bg-white w-full max-w-16 p-3 border-2 border-gray-200 rounded-lg outline-none focus:border-red-600 focus:shadow-lg focus:shadow-red-500/20 text-center font-bold text-xl text-red-700 transition-all duration-300'
                                        />
                                    )
                                })
                            }
                        </div>
                        
                    </div>
             
                    <button disabled={!valideValue} className={` ${valideValue ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 hover:scale-105 shadow-lg hover:shadow-xl" : "bg-gray-500" } text-white py-3 rounded-lg font-semibold my-3 tracking-wide transition-all duration-300`}>Verify OTP</button>

                </form>

                <p className='text-center text-gray-600'>
                    Already have account? <Link to={"/login"} className='font-bold text-red-600 hover:text-red-700 transition-colors'>Login</Link>
                </p>
            </div>
        </section>
    )
}

export default OtpVerification



