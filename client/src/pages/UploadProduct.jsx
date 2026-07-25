import React, { useState } from 'react'
import uploadImage from '../utils/UploadImage'
import Loading from '../components/Loading'
import ViewImage from '../components/ViewImage'
import { useSelector } from 'react-redux'
import AddFieldComponent from '../components/AddFieldComponent'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import successAlert from '../utils/SuccessAlert'
import {
    Upload,
    Package,
    ImagePlus,
    X,
    Trash2,
    Tag,
    FolderTree,
    Scale,
    Warehouse,
    IndianRupee,
    Percent,
    FileText,
    PlusCircle,
    CheckCircle,
    Loader2,
    Info,
    ChevronDown
} from 'lucide-react'

const UploadProduct = () => {
    const [data, setData] = useState({
        name: "",
        image: [],
        category: [],
        subCategory: [],
        unit: "",
        stock: "",
        price: "",
        discount: "",
        description: "",
        more_details: {},
    })
    const [imageLoading, setImageLoading] = useState(false)
    const [ViewImageURL, setViewImageURL] = useState("")
    const allCategory = useSelector(state => state.product.allCategory)
    const [selectCategory, setSelectCategory] = useState("")
    const [selectSubCategory, setSelectSubCategory] = useState("")
    const allSubCategory = useSelector(state => state.product.allSubCategory)

    const [openAddField, setOpenAddField] = useState(false)
    const [fieldName, setFieldName] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const handleUploadImage = async (e) => {
        const file = e.target.files[0]

        if (!file) {
            return
        }
        setImageLoading(true)
        const response = await uploadImage(file)
        const { data: ImageResponse } = response
        const imageUrl = ImageResponse.data.url

        setData((preve) => {
            return {
                ...preve,
                image: [...preve.image, imageUrl]
            }
        })
        setImageLoading(false)

    }

    const handleDeleteImage = async (index) => {
        data.image.splice(index, 1)
        setData((preve) => {
            return {
                ...preve
            }
        })
    }

    const handleRemoveCategory = async (index) => {
        data.category.splice(index, 1)
        setData((preve) => {
            return {
                ...preve
            }
        })
    }
    const handleRemoveSubCategory = async (index) => {
        data.subCategory.splice(index, 1)
        setData((preve) => {
            return {
                ...preve
            }
        })
    }

    const handleAddField = () => {
        setData((preve) => {
            return {
                ...preve,
                more_details: {
                    ...preve.more_details,
                    [fieldName]: ""
                }
            }
        })
        setFieldName("")
        setOpenAddField(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setSubmitting(true)
            const response = await Axios({
                ...SummaryApi.createProduct,
                data: data
            })
            const { data: responseData } = response

            if (responseData.success) {
                successAlert(responseData.message)
                setData({
                    name: "",
                    image: [],
                    category: [],
                    subCategory: [],
                    unit: "",
                    stock: "",
                    price: "",
                    discount: "",
                    description: "",
                    more_details: {},
                })

            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setSubmitting(false)
        }
    }

    // Calculate selling price
    const sellingPrice = data.price && data.discount
        ? Math.round(data.price - (data.price * data.discount / 100))
        : data.price || 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Upload className="text-red-500" size={28} />
                            Upload Product
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Add new products to your store inventory
                        </p>
                    </div>
                    {/* Quick Stats */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                            <ImagePlus size={16} className="text-gray-500" />
                            <span className="text-gray-700 font-medium">{data.image.length}</span>
                            <span className="text-gray-500">images</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                            <Tag size={16} className="text-gray-500" />
                            <span className="text-gray-700 font-medium">{data.category.length}</span>
                            <span className="text-gray-500">categories</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Package size={20} className="text-gray-400" />
                        Basic Information
                    </h2>

                    <div className="space-y-5">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Package size={14} className="text-gray-400" />
                                Product Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Enter product name"
                                name="name"
                                value={data.name}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText size={14} className="text-gray-400" />
                                Description
                            </label>
                            <textarea
                                id="description"
                                placeholder="Enter product description"
                                name="description"
                                value={data.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Product Images Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <ImagePlus size={20} className="text-gray-400" />
                        Product Images
                    </h2>

                    {/* Upload Area */}
                    <label
                        htmlFor="productImage"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all"
                    >
                        {imageLoading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 size={28} className="animate-spin text-gray-400" />
                                <span className="text-sm text-gray-500">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                                    <ImagePlus size={24} className="text-gray-500" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Click to upload images</span>
                                <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB</span>
                            </div>
                        )}
                        <input
                            type="file"
                            id="productImage"
                            className="hidden"
                            accept="image/*"
                            onChange={handleUploadImage}
                        />
                    </label>

                    {/* Uploaded Images Preview */}
                    {data.image.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-3">Uploaded Images ({data.image.length})</p>
                            <div className="flex flex-wrap gap-3">
                                {data.image.map((img, index) => (
                                    <div
                                        key={img + index}
                                        className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 bg-white"
                                    >
                                        <img
                                            src={img}
                                            alt={`Product ${index + 1}`}
                                            className="w-full h-full object-contain p-1 cursor-pointer"
                                            onClick={() => setViewImageURL(img)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteImage(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Tag size={20} className="text-gray-400" />
                        Categories
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Tag size={14} className="text-gray-400" />
                                Category
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900 appearance-none cursor-pointer"
                                    value={selectCategory}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        const category = allCategory.find(el => el._id === value)

                                        setData((preve) => {
                                            return {
                                                ...preve,
                                                category: [...preve.category, category],
                                            }
                                        })
                                        setSelectCategory("")
                                    }}
                                >
                                    <option value="">Select Category</option>
                                    {allCategory.map((c) => (
                                        <option key={c._id} value={c?._id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {/* Selected Categories */}
                            {data.category.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {data.category.map((c, index) => (
                                        <span
                                            key={c._id + index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm"
                                        >
                                            {c.name}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCategory(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sub Category */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FolderTree size={14} className="text-gray-400" />
                                Sub Category
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900 appearance-none cursor-pointer"
                                    value={selectSubCategory}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        const subCategory = allSubCategory.find(el => el._id === value)

                                        setData((preve) => {
                                            return {
                                                ...preve,
                                                subCategory: [...preve.subCategory, subCategory]
                                            }
                                        })
                                        setSelectSubCategory("")
                                    }}
                                >
                                    <option value="">Select Sub Category</option>
                                    {allSubCategory.map((c) => (
                                        <option key={c._id} value={c?._id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {/* Selected Sub Categories */}
                            {data.subCategory.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {data.subCategory.map((c, index) => (
                                        <span
                                            key={c._id + index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm"
                                        >
                                            {c.name}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubCategory(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pricing & Inventory Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <IndianRupee size={20} className="text-gray-400" />
                        Pricing & Inventory
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Unit */}
                        <div className="space-y-2">
                            <label htmlFor="unit" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Scale size={14} className="text-gray-400" />
                                Unit
                            </label>
                            <input
                                id="unit"
                                type="text"
                                placeholder="e.g., 1kg, 500g"
                                name="unit"
                                value={data.unit}
                                onChange={handleChange}
                                required
                                className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900"
                            />
                        </div>

                        {/* Stock */}
                        <div className="space-y-2">
                            <label htmlFor="stock" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Warehouse size={14} className="text-gray-400" />
                                Stock
                            </label>
                            <input
                                id="stock"
                                type="number"
                                placeholder="Enter stock"
                                name="stock"
                                value={data.stock}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900"
                            />
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <label htmlFor="price" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <IndianRupee size={14} className="text-gray-400" />
                                Price (₹)
                            </label>
                            <input
                                id="price"
                                type="number"
                                placeholder="Enter price"
                                name="price"
                                value={data.price}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900"
                            />
                        </div>

                        {/* Discount */}
                        <div className="space-y-2">
                            <label htmlFor="discount" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Percent size={14} className="text-gray-400" />
                                Discount (%)
                            </label>
                            <input
                                id="discount"
                                type="number"
                                placeholder="Enter discount"
                                name="discount"
                                value={data.discount}
                                onChange={handleChange}
                                required
                                min="0"
                                max="100"
                                className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Price Preview */}
                    {data.price && (
                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Info size={16} className="text-green-600" />
                                <span className="text-sm font-medium text-green-700">Price Preview</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {data.discount > 0 && (
                                    <span className="text-lg text-gray-400 line-through">₹{data.price}</span>
                                )}
                                <span className="text-2xl font-bold text-green-700">₹{sellingPrice}</span>
                                {data.discount > 0 && (
                                    <span className="px-2 py-1 bg-green-200 text-green-800 text-sm font-medium rounded-lg">
                                        {data.discount}% OFF
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Custom Fields Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <PlusCircle size={20} className="text-gray-400" />
                            Custom Fields
                        </h2>
                        <button
                            type="button"
                            onClick={() => setOpenAddField(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <PlusCircle size={16} />
                            Add Field
                        </button>
                    </div>

                    {Object.keys(data.more_details).length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <PlusCircle size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No custom fields added yet</p>
                            <p className="text-xs mt-1">Add fields like Brand, Material, Warranty, etc.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {Object.keys(data.more_details).map((k, index) => (
                                <div className="space-y-2" key={k + index}>
                                    <label htmlFor={k} className="text-sm font-medium text-gray-700 capitalize">
                                        {k}
                                    </label>
                                    <input
                                        id={k}
                                        type="text"
                                        placeholder={`Enter ${k}`}
                                        value={data.more_details[k]}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            setData((preve) => {
                                                return {
                                                    ...preve,
                                                    more_details: {
                                                        ...preve.more_details,
                                                        [k]: value
                                                    }
                                                }
                                            })
                                        }}
                                        required
                                        className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => setData({
                            name: "",
                            image: [],
                            category: [],
                            subCategory: [],
                            unit: "",
                            stock: "",
                            price: "",
                            discount: "",
                            description: "",
                            more_details: {},
                        })}
                        className="px-6 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                    >
                        Reset Form
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Upload Product
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* View Image Modal */}
            {ViewImageURL && (
                <ViewImage url={ViewImageURL} close={() => setViewImageURL("")} />
            )}

            {/* Add Field Modal */}
            {openAddField && (
                <AddFieldComponent
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    submit={handleAddField}
                    close={() => setOpenAddField(false)}
                />
            )}
        </div>
    )
}

export default UploadProduct
