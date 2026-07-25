import React from 'react';
import { useForm } from "react-hook-form";
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import { X, MapPin, Phone, Building2 } from 'lucide-react';
import { useGlobalContext } from '../provider/GlobalProvider';

const EditAddressDetails = ({ close, data }) => {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            _id: data._id,
            userId: data.userId,
            address_line: data.address_line,
            city: data.city,
            state: data.state,
            country: data.country,
            pincode: data.pincode,
            mobile: data.mobile
        }
    });
    const { fetchAddress } = useGlobalContext();

    const onSubmit = async (data) => {
        try {
            const response = await Axios({
                ...SummaryApi.updateAddress,
                data: {
                    ...data,
                    address_line: data.address_line,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    pincode: data.pincode,
                    mobile: data.mobile
                }
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                if (close) {
                    close();
                    reset();
                    fetchAddress();
                }
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section className='bg-black/60 backdrop-blur-sm fixed inset-0 z-50 flex items-start justify-center overflow-auto py-8 px-4'>
            <div className='bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden'>
                {/* Header */}
                <div className='flex justify-between items-center p-5 border-b border-gray-100'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center'>
                            <MapPin size={20} className='text-white' />
                        </div>
                        <h2 className='font-bold text-lg text-gray-900'>Edit Address</h2>
                    </div>
                    <button
                        onClick={close}
                        className='w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors'
                    >
                        <X size={20} className='text-gray-600' />
                    </button>
                </div>

                {/* Form */}
                <form className='p-5 space-y-4' onSubmit={handleSubmit(onSubmit)}>
                    {/* Address Line */}
                    <div>
                        <label htmlFor='addressline' className='block text-sm font-medium text-gray-700 mb-1.5'>
                            Address Line <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            id='addressline'
                            className='w-full p-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors text-sm'
                            placeholder='Enter your address'
                            {...register("address_line", { required: true })}
                        />
                    </div>

                    {/* City & State - Two Column */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor='city' className='block text-sm font-medium text-gray-700 mb-1.5'>
                                City <span className='text-red-500'>*</span>
                            </label>
                            <input
                                type='text'
                                id='city'
                                className='w-full p-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors text-sm'
                                placeholder='City'
                                {...register("city", { required: true })}
                            />
                        </div>
                        <div>
                            <label htmlFor='state' className='block text-sm font-medium text-gray-700 mb-1.5'>
                                State <span className='text-red-500'>*</span>
                            </label>
                            <input
                                type='text'
                                id='state'
                                className='w-full p-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors text-sm'
                                placeholder='State'
                                {...register("state", { required: true })}
                            />
                        </div>
                    </div>

                    {/* Pincode & Country - Two Column */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor='pincode' className='block text-sm font-medium text-gray-700 mb-1.5'>
                                Pincode <span className='text-red-500'>*</span>
                            </label>
                            <input
                                type='text'
                                id='pincode'
                                className='w-full p-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors text-sm'
                                placeholder='Pincode'
                                {...register("pincode", { required: true })}
                            />
                        </div>
                        <div>
                            <label htmlFor='country' className='block text-sm font-medium text-gray-700 mb-1.5'>
                                Country <span className='text-red-500'>*</span>
                            </label>
                            <input
                                type='text'
                                id='country'
                                className='w-full p-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors text-sm'
                                placeholder='Country'
                                {...register("country", { required: true })}
                            />
                        </div>
                    </div>

                    {/* Mobile */}
                    <div>
                        <label htmlFor='mobile' className='block text-sm font-medium text-gray-700 mb-1.5'>
                            Mobile Number <span className='text-red-500'>*</span>
                        </label>
                        <div className='relative'>
                            <Phone size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                            <input
                                type='text'
                                id='mobile'
                                className='w-full p-3 pl-10 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors text-sm'
                                placeholder='10-digit mobile number'
                                {...register("mobile", { required: true })}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-3 pt-2'>
                        <button
                            type='button'
                            onClick={close}
                            className='flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors'
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditAddressDetails;
