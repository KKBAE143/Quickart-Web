import React, { useState } from 'react'
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa6";
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [data, setData] = useState({
        email: "",
    })
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

    const valideValue = Object.values(data).every(el => el)


    const handleSubmit = async(e)=>{
        e.preventDefault()

        try {
            const response = await Axios({
                ...SummaryApi.forgot_password,
                data : data
            })
            
            if(response.data.error){
                toast.error(response.data.message)
            }

            if(response.data.success){
                toast.success(response.data.message)
                navigate("/verification-otp",{
                  state : data
                })
                setData({
                    email : "",
                })
                
            }

        } catch (error) {
            AxiosToastError(error)
        }



    }

    return (
        <section className='w-full container mx-auto px-2'>
            <div className='bg-white my-4 w-full max-w-lg mx-auto rounded-xl shadow-lg border-2 border-gray-100 p-7'>
                <h1 className='text-2xl font-bold text-red-700 mb-2'>Forgot Password?</h1>
                <p className='text-gray-600 mb-4'>Enter your email to receive a OTP</p>
                <form className='grid gap-4 py-4' onSubmit={handleSubmit}>
                    <div className='grid gap-1'>
                        <label htmlFor='email' className='font-semibold text-gray-700'>Email :</label>
                        <input
                            type='email'
                            id='email'
                            className='bg-white p-2 border-2 border-gray-200 rounded-lg outline-none focus:border-red-600 focus:shadow-lg focus:shadow-red-500/20 transition-all duration-300'
                            name='email'
                            value={data.email}
                            onChange={handleChange}
                            placeholder='Enter your email'
                        />
                    </div>
             
                    <button disabled={!valideValue} className={` ${valideValue ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 hover:scale-105 shadow-lg hover:shadow-xl" : "bg-gray-500" } text-white py-3 rounded-lg font-semibold my-3 tracking-wide transition-all duration-300`}>Send OTP</button>

                </form>

                <p className='text-center text-gray-600'>
                    Already have account? <Link to={"/login"} className='font-bold text-red-600 hover:text-red-700 transition-colors'>Login</Link>
                </p>
            </div>
        </section>
    )
}

export default ForgotPassword


