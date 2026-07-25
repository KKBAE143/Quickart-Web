import { useRef, useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast';
import {
    Eye,
    EyeOff,
    Camera,
    IdCard,
    Upload,
    CheckCircle,
    X,
    Info,
    Loader2,
    Bike,
    User,
    Mail,
    Phone,
    Lock,
    Car,
    FileText,
    ChevronRight,
    ChevronLeft,
    Shield,
    ArrowRight
} from 'lucide-react';

import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import uploadImagePublic from '../utils/UploadImagePublic';
import { validateID, getIDPlaceholder, getIDHelpText } from '../utils/idValidation';
import { Link, useNavigate } from 'react-router-dom';

const RiderRegister = () => {
    // Steps: 1: Basic Info, 2: Vehicle & ID, 3: Document Upload, 4: OTP Verification
    const [step, setStep] = useState(1)
    const [data, setData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        // Vehicle details
        vehicleType: "",
        vehicleNumber: "",
        vehicleModel: "",
        // Document details
        idType: "",
        idNumber: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [otp, setOtp] = useState(["","","","","",""])
    const otpRefs = useRef([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    // Document uploads
    const [idDocumentImage, setIdDocumentImage] = useState(null)
    const [idDocumentPreview, setIdDocumentPreview] = useState(null)
    const [selfieImage, setSelfieImage] = useState(null)
    const [selfiePreview, setSelfiePreview] = useState(null)
    const [uploadingId, setUploadingId] = useState(false)
    const [uploadingSelfie, setUploadingSelfie] = useState(false)

    // ID Validation state
    const [idValidation, setIdValidation] = useState(null)

    // Refs for file inputs
    const idDocumentInputRef = useRef(null)
    const selfieInputRef = useRef(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [showCamera, setShowCamera] = useState(false)
    const [cameraStream, setCameraStream] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setData((prev) => ({
            ...prev,
            [name]: value
        }))

        // Validate ID when idNumber or idType changes
        if (name === 'idNumber' || name === 'idType') {
            const idType = name === 'idType' ? value : data.idType
            const idNumber = name === 'idNumber' ? value : data.idNumber
            if (idType && idNumber) {
                const validation = validateID(idType, idNumber)
                setIdValidation(validation)
            } else {
                setIdValidation(null)
            }
        }
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))
    const mobileValid = /^\d{10}$/.test(String(data.mobile))
    const passwordValid = data.password.length >= 8
    const passwordsMatch = data.password === data.confirmPassword && data.confirmPassword.length > 0

    // Step 1 validation
    const step1Valid = Boolean(data.name) && mobileValid && emailValid && passwordValid && passwordsMatch

    // Step 2 validation - now includes ID validation
    const step2Valid = Boolean(data.vehicleType) &&
                       Boolean(data.vehicleNumber) &&
                       Boolean(data.idType) &&
                       Boolean(data.idNumber) &&
                       idValidation?.valid === true

    // Step 3 validation - document uploads
    const step3Valid = Boolean(idDocumentImage) && Boolean(selfieImage)

    // Handle ID document upload
    const handleIdDocumentUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image (JPG, PNG, or WebP)')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => setIdDocumentPreview(e.target.result)
        reader.readAsDataURL(file)

        // Upload to server
        setUploadingId(true)
        try {
            const response = await uploadImagePublic(file)
            // Cloudinary returns url or secure_url
            const imageUrl = response?.data?.data?.url || response?.data?.data?.secure_url
            console.log('ID document upload response:', response?.data)
            console.log('Extracted URL:', imageUrl)
            if (imageUrl) {
                setIdDocumentImage(imageUrl)
                toast.success('ID document uploaded successfully')
            } else {
                console.error('No URL in upload response:', response?.data)
                throw new Error('Upload failed - no URL returned')
            }
        } catch (error) {
            console.error('ID document upload error:', error)
            toast.error('Failed to upload ID document')
            setIdDocumentPreview(null)
        } finally {
            setUploadingId(false)
        }
    }

    // Handle selfie upload from file
    const handleSelfieUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image (JPG, PNG, or WebP)')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => setSelfiePreview(e.target.result)
        reader.readAsDataURL(file)

        // Upload to server
        setUploadingSelfie(true)
        try {
            const response = await uploadImagePublic(file)
            // Cloudinary returns url or secure_url
            const imageUrl = response?.data?.data?.url || response?.data?.data?.secure_url
            console.log('Selfie upload response:', response?.data)
            console.log('Extracted URL:', imageUrl)
            if (imageUrl) {
                setSelfieImage(imageUrl)
                toast.success('Selfie uploaded successfully')
            } else {
                console.error('No URL in upload response:', response?.data)
                throw new Error('Upload failed - no URL returned')
            }
        } catch (error) {
            console.error('Selfie upload error:', error)
            toast.error('Failed to upload selfie')
            setSelfiePreview(null)
        } finally {
            setUploadingSelfie(false)
        }
    }

    // Start camera for selfie
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            })
            setCameraStream(stream)
            setShowCamera(true)
            // Note: srcObject will be set by useEffect after video element renders
        } catch (error) {
            console.error('Camera access error:', error)
            toast.error('Could not access camera. Please upload a photo instead.')
        }
    }

    // Effect to attach camera stream to video element once it's rendered
    useEffect(() => {
        if (showCamera && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream
            // Ensure video starts playing
            videoRef.current.play().catch(err => {
                console.error('Video play error:', err)
            })
        }
    }, [showCamera, cameraStream])

    // Stop camera
    const stopCamera = useCallback(() => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        setShowCamera(false)
    }, [cameraStream])

    // Capture selfie from camera
    const captureSelfie = async () => {
        if (!videoRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        // Convert to blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast.error('Failed to capture image')
                return
            }

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => setSelfiePreview(e.target.result)
            reader.readAsDataURL(blob)

            // Upload
            setUploadingSelfie(true)
            stopCamera()

            try {
                const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
                const response = await uploadImagePublic(file)
                // Cloudinary returns url or secure_url
                const imageUrl = response?.data?.data?.url || response?.data?.data?.secure_url
                console.log('Camera selfie upload response:', response?.data)
                console.log('Extracted URL:', imageUrl)
                if (imageUrl) {
                    setSelfieImage(imageUrl)
                    toast.success('Selfie captured and uploaded!')
                } else {
                    console.error('No URL in upload response:', response?.data)
                    throw new Error('Upload failed - no URL returned')
                }
            } catch (error) {
                console.error('Camera selfie upload error:', error)
                toast.error('Failed to upload selfie')
                setSelfiePreview(null)
            } finally {
                setUploadingSelfie(false)
            }
        }, 'image/jpeg', 0.8)
    }

    // Remove uploaded ID document
    const removeIdDocument = () => {
        setIdDocumentImage(null)
        setIdDocumentPreview(null)
        if (idDocumentInputRef.current) {
            idDocumentInputRef.current.value = ''
        }
    }

    // Remove uploaded selfie
    const removeSelfie = () => {
        setSelfieImage(null)
        setSelfiePreview(null)
        if (selfieInputRef.current) {
            selfieInputRef.current.value = ''
        }
    }

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

    const handleNextStep = () => {
        if(step === 1 && step1Valid) {
            setStep(2)
        } else if(step === 2 && step2Valid) {
            setStep(3)
        }
    }

    const handlePrevStep = () => {
        if(step === 2) {
            setStep(1)
        } else if(step === 3) {
            setStep(2)
        } else if(step === 4) {
            setStep(3)
        }
    }

    const handleSendOtp = async() => {
        if(!step3Valid) return
        setLoading(true)
        try {
            const response = await Axios({
                ...SummaryApi.sendOtp,
                data : { mobile : data.mobile, intent : 'rider-register', email : data.email }
            })
            if(response.data.success){
                toast.success(response.data.message)
                setStep(4)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async(e)=>{
        e.preventDefault()
        if(step !== 4) return

        setLoading(true)
        try {
            const code = otp.join("")
            const response = await Axios({
                ...SummaryApi.riderRegister,
                data : {
                    mobile : data.mobile,
                    otp : code,
                    name : data.name,
                    email : data.email,
                    password: data.password,
                    vehicleType: data.vehicleType,
                    vehicleNumber: data.vehicleNumber,
                    vehicleModel: data.vehicleModel,
                    idType: data.idType,
                    idNumber: data.idNumber,
                    idDocumentImage: idDocumentImage,
                    selfieImage: selfieImage
                }
            })
            if(response.data.error){
                toast.error(response.data.message)
                return
            }
            if(response.data.success){
                toast.success("Registration submitted! Your application is pending approval.")
                navigate("/login")
            }

        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    const vehicleTypes = [
        { value: 'BIKE', label: 'Bike' },
        { value: 'SCOOTER', label: 'Scooter' },
        { value: 'BICYCLE', label: 'Bicycle' },
        { value: 'CAR', label: 'Car' },
        { value: 'VAN', label: 'Van' }
    ]

    const idTypes = [
        { value: 'AADHAAR', label: 'Aadhaar Card' },
        { value: 'PAN', label: 'PAN Card' },
        { value: 'DRIVING_LICENSE', label: 'Driving License' },
        { value: 'VOTER_ID', label: 'Voter ID' }
    ]

    const stepLabels = [
        { num: 1, label: 'Info', icon: User },
        { num: 2, label: 'Vehicle', icon: Car },
        { num: 3, label: 'Docs', icon: FileText },
        { num: 4, label: 'Verify', icon: Shield }
    ]

    return (
        <section className='w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-8'>
            <div className='bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden'>
                {/* Header Section */}
                <div className='bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-8 text-center relative overflow-hidden'>
                    <div className='absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/5 rounded-full blur-3xl'></div>
                    <div className='relative z-10'>
                        <div className='w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm'>
                            <Bike size={32} className='text-white' />
                        </div>
                        <h1 className='text-3xl font-bold text-white mb-2'>Become a Rider</h1>
                        <p className='text-gray-400 text-sm'>Join our delivery team and start earning</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className='px-4 md:px-8 pt-6'>
                    <div className='flex items-center justify-between mb-6'>
                        {stepLabels.map((s, index) => {
                            const Icon = s.icon
                            return (
                                <div key={s.num} className='flex items-center'>
                                    <div className='flex flex-col items-center'>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                                            step >= s.num
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {step > s.num ? <CheckCircle size={18} /> : <Icon size={18} />}
                                        </div>
                                        <span className={`text-xs mt-1.5 font-medium ${
                                            step >= s.num ? 'text-gray-900' : 'text-gray-400'
                                        }`}>{s.label}</span>
                                    </div>
                                    {index < stepLabels.length - 1 && (
                                        <div className={`flex-1 h-1 mx-2 rounded ${
                                            step > s.num ? 'bg-gray-900' : 'bg-gray-100'
                                        }`} style={{ width: '30px' }}></div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className='px-4 md:px-8 pb-8'>
                    <form className='space-y-4' onSubmit={handleSubmit}>

                        {/* Step 1: Basic Information */}
                        {step === 1 && (
                            <>
                                <div>
                                    <label htmlFor='name' className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <User size={14} className='text-gray-400' />
                                        Full Name
                                    </label>
                                    <input
                                        type='text'
                                        id='name'
                                        autoFocus
                                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 ${
                                            data.name ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                        }`}
                                        name='name'
                                        value={data.name}
                                        onChange={handleChange}
                                        placeholder='John Doe'
                                    />
                                    {!data.name && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Name is required</p>}
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <Phone size={14} className='text-gray-400' />
                                        Mobile Number
                                    </label>
                                    <input
                                        type='tel'
                                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 ${
                                            mobileValid ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                        }`}
                                        name='mobile'
                                        value={data.mobile}
                                        onChange={(e)=> setData(prev=> ({...prev, mobile: e.target.value.replace(/\D/g,'')}))}
                                        placeholder='9876543210'
                                        maxLength={10}
                                    />
                                    {data.mobile && !mobileValid && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Enter a valid 10-digit mobile number</p>}
                                    {!data.mobile && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Mobile number is required</p>}
                                </div>
                                <div>
                                    <label htmlFor='email' className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <Mail size={14} className='text-gray-400' />
                                        Email Address
                                    </label>
                                    <input
                                        type='email'
                                        id='email'
                                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 ${
                                            emailValid ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                        }`}
                                        name='email'
                                        value={data.email}
                                        onChange={handleChange}
                                        placeholder='yourname@example.com'
                                        required
                                    />
                                    {data.email && !emailValid && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Enter a valid email address</p>}
                                    {!data.email && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Email is required</p>}
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor='password' className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <Lock size={14} className='text-gray-400' />
                                        Password
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id='password'
                                            className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 pr-12 ${
                                                passwordValid ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                            }`}
                                            name='password'
                                            value={data.password}
                                            onChange={handleChange}
                                            placeholder='Minimum 8 characters'
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowPassword(!showPassword)}
                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors'
                                        >
                                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {data.password && !passwordValid && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Password must be at least 8 characters</p>}
                                    {!data.password && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Password is required</p>}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor='confirmPassword' className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <Lock size={14} className='text-gray-400' />
                                        Confirm Password
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id='confirmPassword'
                                            className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 pr-12 ${
                                                passwordsMatch ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                            }`}
                                            name='confirmPassword'
                                            value={data.confirmPassword}
                                            onChange={handleChange}
                                            placeholder='Re-enter your password'
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors'
                                        >
                                            {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {data.confirmPassword && !passwordsMatch && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Passwords do not match</p>}
                                    {!data.confirmPassword && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Please confirm your password</p>}
                                </div>

                                <button
                                    type='button'
                                    disabled={!step1Valid}
                                    onClick={handleNextStep}
                                    className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                                        step1Valid
                                            ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Next: Vehicle Details
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        )}

                        {/* Step 2: Vehicle & ID Information */}
                        {step === 2 && (
                            <>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <Car size={14} className='text-gray-400' />
                                        Vehicle Type
                                    </label>
                                    <select
                                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 ${
                                            data.vehicleType ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                        }`}
                                        name='vehicleType'
                                        value={data.vehicleType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select vehicle type</option>
                                        {vehicleTypes.map(v => (
                                            <option key={v.value} value={v.value}>{v.label}</option>
                                        ))}
                                    </select>
                                    {!data.vehicleType && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Vehicle type is required</p>}
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Vehicle Number</label>
                                    <input
                                        type='text'
                                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 uppercase ${
                                            data.vehicleNumber ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                        }`}
                                        name='vehicleNumber'
                                        value={data.vehicleNumber}
                                        onChange={(e) => setData(prev => ({...prev, vehicleNumber: e.target.value.toUpperCase()}))}
                                        placeholder='MH12AB1234'
                                    />
                                    {!data.vehicleNumber && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />Vehicle number is required</p>}
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Vehicle Model (Optional)</label>
                                    <input
                                        type='text'
                                        className='w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all duration-300 text-gray-800'
                                        name='vehicleModel'
                                        value={data.vehicleModel}
                                        onChange={handleChange}
                                        placeholder='Honda Activa 6G'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <IdCard size={14} className='text-gray-400' />
                                        ID Proof Type
                                    </label>
                                    <select
                                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 ${
                                            data.idType ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                        }`}
                                        name='idType'
                                        value={data.idType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select ID type</option>
                                        {idTypes.map(id => (
                                            <option key={id.value} value={id.value}>{id.label}</option>
                                        ))}
                                    </select>
                                    {!data.idType && <p className='text-xs text-red-500 mt-1.5 flex items-center gap-1'><X size={12} />ID type is required</p>}
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>ID Number</label>
                                    <input
                                        type='text'
                                        className={`w-full px-4 py-3.5 bg-gray-50 border-2 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-300 text-gray-800 ${
                                            idValidation?.valid ? 'border-green-500 focus:border-green-500 bg-white' : data.idNumber ? 'border-gray-900 focus:border-gray-900 bg-white' : 'border-gray-200 focus:border-gray-300'
                                        }`}
                                        name='idNumber'
                                        value={data.idNumber}
                                        onChange={handleChange}
                                        placeholder={data.idType ? getIDPlaceholder(data.idType) : 'Select ID type first'}
                                    />
                                    {data.idType && (
                                        <p className='text-xs text-gray-500 mt-1.5 flex items-center gap-1'>
                                            <Info size={12} className='text-blue-500' />
                                            {getIDHelpText(data.idType)}
                                        </p>
                                    )}
                                    {idValidation && (
                                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${idValidation.valid ? 'text-green-600' : 'text-red-500'}`}>
                                            {idValidation.valid ? <CheckCircle size={12} /> : <X size={12} />}
                                            {idValidation.message}
                                        </p>
                                    )}
                                </div>

                                <div className='flex gap-3 pt-2'>
                                    <button
                                        type='button'
                                        onClick={handlePrevStep}
                                        className='flex-1 py-4 rounded-xl font-bold text-base border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2'
                                    >
                                        <ChevronLeft size={18} />
                                        Back
                                    </button>
                                    <button
                                        type='button'
                                        disabled={!step2Valid}
                                        onClick={handleNextStep}
                                        className={`flex-1 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                                            step2Valid
                                                ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Next: Documents
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 3: Document Upload */}
                        {step === 3 && (
                            <>
                                <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2'>
                                    <p className='text-sm text-blue-700 flex items-start gap-2'>
                                        <Info size={16} className='mt-0.5 flex-shrink-0' />
                                        <span>Please upload clear photos of your ID document and a selfie for verification. Our team will review these documents.</span>
                                    </p>
                                </div>

                                {/* ID Document Upload */}
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <IdCard size={14} className='text-gray-400' />
                                        Upload {data.idType ? idTypes.find(t => t.value === data.idType)?.label : 'ID Document'}
                                    </label>

                                    {idDocumentPreview ? (
                                        <div className='relative'>
                                            <img
                                                src={idDocumentPreview}
                                                alt='ID Document'
                                                className='w-full h-48 object-cover rounded-xl border-2 border-green-400'
                                            />
                                            <button
                                                type='button'
                                                onClick={removeIdDocument}
                                                className='absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-all shadow-lg'
                                            >
                                                <X size={16} />
                                            </button>
                                            {idDocumentImage && (
                                                <div className='absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg'>
                                                    <CheckCircle size={12} /> Uploaded
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => idDocumentInputRef.current?.click()}
                                            className='border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all duration-300'
                                        >
                                            {uploadingId ? (
                                                <div className='flex flex-col items-center'>
                                                    <Loader2 size={32} className='animate-spin text-gray-400 mb-2' />
                                                    <p className='text-sm text-gray-500'>Uploading...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className='w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3'>
                                                        <Upload size={24} className='text-gray-400' />
                                                    </div>
                                                    <p className='text-sm text-gray-600 font-medium'>Click to upload ID document</p>
                                                    <p className='text-xs text-gray-400 mt-1'>JPG, PNG or WebP (max 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={idDocumentInputRef}
                                        type='file'
                                        accept='image/jpeg,image/jpg,image/png,image/webp'
                                        onChange={handleIdDocumentUpload}
                                        className='hidden'
                                    />
                                </div>

                                {/* Selfie Upload */}
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                        <Camera size={14} className='text-gray-400' />
                                        Upload Selfie (Face Verification)
                                    </label>

                                    {showCamera ? (
                                        <div className='relative'>
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className='w-full h-64 object-cover rounded-xl border-2 border-gray-900'
                                            />
                                            <canvas ref={canvasRef} className='hidden' />
                                            <div className='absolute bottom-4 left-0 right-0 flex justify-center gap-3'>
                                                <button
                                                    type='button'
                                                    onClick={captureSelfie}
                                                    className='bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg'
                                                >
                                                    <Camera size={16} /> Capture
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={stopCamera}
                                                    className='bg-gray-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-lg'
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : selfiePreview ? (
                                        <div className='relative'>
                                            <img
                                                src={selfiePreview}
                                                alt='Selfie'
                                                className='w-full h-48 object-cover rounded-xl border-2 border-green-400'
                                            />
                                            <button
                                                type='button'
                                                onClick={removeSelfie}
                                                className='absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-all shadow-lg'
                                            >
                                                <X size={16} />
                                            </button>
                                            {selfieImage && (
                                                <div className='absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg'>
                                                    <CheckCircle size={12} /> Uploaded
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='flex gap-3'>
                                            <div
                                                onClick={startCamera}
                                                className='flex-1 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all duration-300'
                                            >
                                                <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2'>
                                                    <Camera size={20} className='text-gray-400' />
                                                </div>
                                                <p className='text-sm text-gray-600 font-medium'>Take Selfie</p>
                                            </div>
                                            <div
                                                onClick={() => selfieInputRef.current?.click()}
                                                className='flex-1 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all duration-300'
                                            >
                                                {uploadingSelfie ? (
                                                    <div className='flex flex-col items-center'>
                                                        <Loader2 size={24} className='animate-spin text-gray-400 mb-2' />
                                                        <p className='text-sm text-gray-500'>Uploading...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2'>
                                                            <Upload size={20} className='text-gray-400' />
                                                        </div>
                                                        <p className='text-sm text-gray-600 font-medium'>Upload Photo</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={selfieInputRef}
                                        type='file'
                                        accept='image/jpeg,image/jpg,image/png,image/webp'
                                        onChange={handleSelfieUpload}
                                        className='hidden'
                                    />
                                </div>

                                <div className='flex gap-3 pt-2'>
                                    <button
                                        type='button'
                                        onClick={handlePrevStep}
                                        className='flex-1 py-4 rounded-xl font-bold text-base border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2'
                                    >
                                        <ChevronLeft size={18} />
                                        Back
                                    </button>
                                    <button
                                        type='button'
                                        disabled={!step3Valid || loading}
                                        onClick={handleSendOtp}
                                        className={`flex-1 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                                            step3Valid && !loading
                                                ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className='animate-spin' />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send OTP
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 4: OTP Verification */}
                        {step === 4 && (
                            <>
                                <div className='text-center mb-4 bg-gray-50 rounded-xl p-4'>
                                    <p className='text-gray-600 text-sm'>We've sent an OTP to your email</p>
                                    <p className='text-gray-900 font-semibold mt-1'>{data.email}</p>
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-3 text-center'>Enter 6-digit OTP</label>
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
                                                className='w-full h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition-all duration-300 bg-gray-50 focus:bg-white'
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className='flex gap-3 pt-2'>
                                    <button
                                        type='button'
                                        onClick={handlePrevStep}
                                        className='flex-1 py-4 rounded-xl font-bold text-base border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2'
                                    >
                                        <ChevronLeft size={18} />
                                        Back
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={otp.join("").length !== 6 || loading}
                                        className={`flex-1 py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                                            otp.join("").length === 6 && !loading
                                                ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className='animate-spin' />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                Submit
                                            </>
                                        )}
                                    </button>
                                </div>

                                <p className='text-center text-sm text-gray-500 mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3'>
                                    Your application will be reviewed by our team. You'll receive an email once approved.
                                </p>
                            </>
                        )}
                    </form>

                    {/* Footer */}
                    <div className='mt-8 pt-6 border-t border-gray-100 text-center'>
                        <p className='text-gray-600'>
                            Already have an account? <Link to={"/login"} className='font-bold text-gray-900 hover:underline transition-colors'>Sign In</Link>
                        </p>
                        <p className='text-gray-500 text-sm mt-2'>
                            Want to shop instead? <Link to={"/register"} className='font-bold text-gray-900 hover:underline transition-colors'>Register as Customer</Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default RiderRegister
