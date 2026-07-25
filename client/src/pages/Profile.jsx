import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import UserProfileAvatarEdit from '../components/UserProfileAvatarEdit'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { setUserDetails } from '../store/userSlice'
import fetchUserDetails from '../utils/fetchUserDetails'
import {
    User,
    Mail,
    Phone,
    Camera,
    Loader2,
    ChevronRight
} from 'lucide-react'

const Profile = () => {
    const user = useSelector(state => state.user)
    const [openProfileAvatarEdit, setProfileAvatarEdit] = useState(false)
    const [userData, setUserData] = useState({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
    })
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()

    useEffect(() => {
        setUserData({
            name: user.name || '',
            email: user.email || '',
            mobile: user.mobile || '',
        })
    }, [user])

    const handleOnChange = (e) => {
        const { name, value } = e.target
        setUserData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.updateUserDetails,
                data: userData
            })

            if (response.data.success) {
                toast.success('Profile updated')
                const userData = await fetchUserDetails()
                dispatch(setUserDetails(userData.data))
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Avatar */}
            <div className="bg-white border-b border-gray-100 px-4 py-6">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <button
                        onClick={() => setProfileAvatarEdit(true)}
                        className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0"
                    >
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User size={24} className="text-gray-400" />
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Camera size={10} className="text-white" />
                        </div>
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-semibold text-gray-900 truncate">
                            {user.name || 'User'}
                        </h1>
                        <p className="text-sm text-gray-500 truncate">
                            {user.email || user.mobile}
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <div className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <User size={12} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={userData.name}
                            onChange={handleOnChange}
                            placeholder="Enter your name"
                            className="w-full text-sm text-gray-900 bg-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Mail size={12} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleOnChange}
                            placeholder="Enter your email"
                            className="w-full text-sm text-gray-900 bg-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Mobile */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Phone size={12} />
                            Mobile Number
                        </label>
                        <input
                            type="text"
                            name="mobile"
                            value={userData.mobile}
                            onChange={handleOnChange}
                            placeholder="Enter your mobile"
                            className="w-full text-sm text-gray-900 bg-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </form>

                {/* Account Info */}
                <div className="mt-6 bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Account Status</span>
                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Active
                        </span>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Member Since</span>
                        <span className="text-sm text-gray-700">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                year: 'numeric'
                            }) : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Avatar Edit Modal */}
            {openProfileAvatarEdit && (
                <UserProfileAvatarEdit close={() => setProfileAvatarEdit(false)} />
            )}
        </div>
    )
}

export default Profile
