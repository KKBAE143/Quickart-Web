import React, { useEffect, useState } from 'react'
import UploadCategoryModel from '../components/UploadCategoryModel'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import EditCategory from '../components/EditCategory'
import CofirmBox from '../components/CofirmBox'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Folder,
    Loader2,
    Package,
    Grid3X3,
    List,
    RefreshCw,
    ImageIcon
} from 'lucide-react'

const CategoryPage = () => {
    const [openUploadCategory, setOpenUploadCategory] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categoryData, setCategoryData] = useState([])
    const [openEdit, setOpenEdit] = useState(false)
    const [editData, setEditData] = useState({
        name: "",
        image: "",
    })
    const [openConfimBoxDelete, setOpenConfirmBoxDelete] = useState(false)
    const [deleteCategory, setDeleteCategory] = useState({
        _id: ""
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

    const fetchCategory = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getCategory
            })
            const { data: responseData } = response

            if (responseData.success) {
                setCategoryData(responseData.data)
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategory()
    }, [])

    const handleDeleteCategory = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.deleteCategory,
                data: deleteCategory
            })

            const { data: responseData } = response

            if (responseData.success) {
                toast.success(responseData.message)
                fetchCategory()
                setOpenConfirmBoxDelete(false)
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    // Filter categories based on search
    const filteredCategories = categoryData.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Folder className="text-red-500" size={28} />
                            Categories
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manage your product categories
                        </p>
                    </div>
                    <button
                        onClick={() => setOpenUploadCategory(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Add Category
                    </button>
                </div>

                {/* Stats & Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                        />
                    </div>

                    {/* View Toggle & Refresh */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <button
                            onClick={fetchCategory}
                            disabled={loading}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600">
                        <Package size={14} className="text-gray-400" />
                        <span className="font-medium">{categoryData.length}</span> total categories
                    </span>
                    {searchTerm && (
                        <span className="text-gray-500">
                            • {filteredCategories.length} matching
                        </span>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading categories...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredCategories.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Folder size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {searchTerm ? 'No categories found' : 'No categories yet'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                        {searchTerm
                            ? `No categories match "${searchTerm}"`
                            : 'Get started by adding your first category'
                        }
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setOpenUploadCategory(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-all"
                        >
                            <Plus size={16} />
                            Add Category
                        </button>
                    )}
                </div>
            )}

            {/* Grid View */}
            {!loading && filteredCategories.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredCategories.map((category) => (
                        <div
                            key={category._id}
                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            {/* Image */}
                            <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                {category.image ? (
                                    <img
                                        alt={category.name}
                                        src={category.image}
                                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon size={40} className="text-gray-300" />
                                    </div>
                                )}
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            setOpenEdit(true)
                                            setEditData(category)
                                        }}
                                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={16} className="text-gray-700" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpenConfirmBoxDelete(true)
                                            setDeleteCategory(category)
                                        }}
                                        className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                            {/* Name */}
                            <div className="p-3 border-t border-gray-100">
                                <h3 className="font-medium text-gray-900 text-sm truncate text-center">
                                    {category.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {!loading && filteredCategories.length > 0 && viewMode === 'list' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredCategories.map((category) => (
                            <div
                                key={category._id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                            >
                                {/* Image */}
                                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                    {category.image ? (
                                        <img
                                            alt={category.name}
                                            src={category.image}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon size={20} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        ID: {category._id?.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setOpenEdit(true)
                                            setEditData(category)
                                        }}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpenConfirmBoxDelete(true)
                                            setDeleteCategory(category)
                                        }}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {openUploadCategory && (
                <UploadCategoryModel fetchData={fetchCategory} close={() => setOpenUploadCategory(false)} />
            )}

            {openEdit && (
                <EditCategory data={editData} close={() => setOpenEdit(false)} fetchData={fetchCategory} />
            )}

            {openConfimBoxDelete && (
                <CofirmBox close={() => setOpenConfirmBoxDelete(false)} cancel={() => setOpenConfirmBoxDelete(false)} confirm={handleDeleteCategory} />
            )}
        </div>
    )
}

export default CategoryPage
