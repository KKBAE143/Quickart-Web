import React, { useEffect, useState } from 'react'
import UploadSubCategoryModel from '../components/UploadSubCategoryModel'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import ViewImage from '../components/ViewImage'
import EditSubCategory from '../components/EditSubCategory'
import CofirmBox from '../components/CofirmBox'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    FolderTree,
    Loader2,
    Package,
    Grid3X3,
    List,
    RefreshCw,
    ImageIcon,
    Tag,
    ChevronRight,
    Filter,
    X
} from 'lucide-react'

const SubCategoryPage = () => {
    const [openAddSubCategory, setOpenAddSubCategory] = useState(false)
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [ImageURL, setImageURL] = useState("")
    const [openEdit, setOpenEdit] = useState(false)
    const [editData, setEditData] = useState({
        _id: ""
    })
    const [deleteSubCategory, setDeleteSubCategory] = useState({
        _id: ""
    })
    const [openDeleteConfirmBox, setOpenDeleteConfirmBox] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [selectedCategory, setSelectedCategory] = useState('all')

    const fetchSubCategory = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getSubCategory
            })
            const { data: responseData } = response

            if (responseData.success) {
                setData(responseData.data)
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubCategory()
    }, [])

    const handleDeleteSubCategory = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.deleteSubCategory,
                data: deleteSubCategory
            })

            const { data: responseData } = response

            if (responseData.success) {
                toast.success(responseData.message)
                fetchSubCategory()
                setOpenDeleteConfirmBox(false)
                setDeleteSubCategory({ _id: "" })
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    // Get unique categories for filter
    const uniqueCategories = [...new Set(
        data.flatMap(sub => sub.category?.map(c => c.name) || [])
    )].sort()

    // Filter subcategories based on search and category filter
    const filteredSubCategories = data.filter(subcat => {
        const matchesSearch = subcat.name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' ||
            subcat.category?.some(c => c.name === selectedCategory)
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FolderTree className="text-red-500" size={28} />
                            Sub Categories
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Organize products with sub-categories under main categories
                        </p>
                    </div>
                    <button
                        onClick={() => setOpenAddSubCategory(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Add Sub Category
                    </button>
                </div>

                {/* Stats & Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search sub-categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="all">All Categories</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
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
                            onClick={fetchSubCategory}
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
                        <span className="font-medium">{data.length}</span> total sub-categories
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-600">
                        <Tag size={14} className="text-gray-400" />
                        <span className="font-medium">{uniqueCategories.length}</span> parent categories
                    </span>
                    {(searchTerm || selectedCategory !== 'all') && (
                        <span className="text-gray-500">
                            • {filteredSubCategories.length} matching
                        </span>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading sub-categories...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredSubCategories.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FolderTree size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {searchTerm || selectedCategory !== 'all' ? 'No sub-categories found' : 'No sub-categories yet'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                        {searchTerm
                            ? `No sub-categories match "${searchTerm}"`
                            : selectedCategory !== 'all'
                                ? `No sub-categories in "${selectedCategory}"`
                                : 'Get started by adding your first sub-category'
                        }
                    </p>
                    {!searchTerm && selectedCategory === 'all' && (
                        <button
                            onClick={() => setOpenAddSubCategory(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-all"
                        >
                            <Plus size={16} />
                            Add Sub Category
                        </button>
                    )}
                </div>
            )}

            {/* Grid View */}
            {!loading && filteredSubCategories.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredSubCategories.map((subCategory) => (
                        <div
                            key={subCategory._id}
                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            {/* Image */}
                            <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                {subCategory.image ? (
                                    <img
                                        alt={subCategory.name}
                                        src={subCategory.image}
                                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                        onClick={() => setImageURL(subCategory.image)}
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
                                            setEditData(subCategory)
                                        }}
                                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={16} className="text-gray-700" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpenDeleteConfirmBox(true)
                                            setDeleteSubCategory(subCategory)
                                        }}
                                        className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                            {/* Info */}
                            <div className="p-3 border-t border-gray-100">
                                <h3 className="font-medium text-gray-900 text-sm truncate text-center mb-2">
                                    {subCategory.name}
                                </h3>
                                {/* Parent Categories */}
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {subCategory.category?.slice(0, 2).map((cat) => (
                                        <span
                                            key={cat._id}
                                            className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full truncate max-w-[80px]"
                                            title={cat.name}
                                        >
                                            {cat.name}
                                        </span>
                                    ))}
                                    {subCategory.category?.length > 2 && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                            +{subCategory.category.length - 2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {!loading && filteredSubCategories.length > 0 && viewMode === 'list' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredSubCategories.map((subCategory) => (
                            <div
                                key={subCategory._id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                            >
                                {/* Image */}
                                <div
                                    className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={() => subCategory.image && setImageURL(subCategory.image)}
                                >
                                    {subCategory.image ? (
                                        <img
                                            alt={subCategory.name}
                                            src={subCategory.image}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon size={20} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">
                                        {subCategory.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-xs text-gray-500">Parent:</span>
                                        {subCategory.category?.map((cat, index) => (
                                            <span
                                                key={cat._id}
                                                className="inline-flex items-center text-xs"
                                            >
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                    {cat.name}
                                                </span>
                                                {index < subCategory.category.length - 1 && (
                                                    <ChevronRight size={12} className="text-gray-400 mx-1" />
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setOpenEdit(true)
                                            setEditData(subCategory)
                                        }}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpenDeleteConfirmBox(true)
                                            setDeleteSubCategory(subCategory)
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
            {openAddSubCategory && (
                <UploadSubCategoryModel
                    close={() => setOpenAddSubCategory(false)}
                    fetchData={fetchSubCategory}
                />
            )}

            {ImageURL && (
                <ViewImage url={ImageURL} close={() => setImageURL("")} />
            )}

            {openEdit && (
                <EditSubCategory
                    data={editData}
                    close={() => setOpenEdit(false)}
                    fetchData={fetchSubCategory}
                />
            )}

            {openDeleteConfirmBox && (
                <CofirmBox
                    cancel={() => setOpenDeleteConfirmBox(false)}
                    close={() => setOpenDeleteConfirmBox(false)}
                    confirm={handleDeleteSubCategory}
                />
            )}
        </div>
    )
}

export default SubCategoryPage
