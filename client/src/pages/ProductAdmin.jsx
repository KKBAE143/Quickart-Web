import React, { useEffect, useState } from 'react'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import ProductCardAdmin from '../components/ProductCardAdmin'
import {
    Search,
    Package,
    Box,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    LayoutList,
    Filter,
    X,
    PackageSearch,
    ArrowUpDown
} from 'lucide-react'

const ProductAdmin = () => {
    const [productData, setProductData] = useState([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [totalPageCount, setTotalPageCount] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [search, setSearch] = useState("")
    const [viewMode, setViewMode] = useState('grid')
    const [limit, setLimit] = useState(12)

    const fetchProductData = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getProduct,
                data: {
                    page: page,
                    limit: limit,
                    search: search
                }
            })

            const { data: responseData } = response

            if (responseData.success) {
                setTotalPageCount(responseData.totalNoPage)
                setProductData(responseData.data)
                setTotalCount(responseData.totalCount || responseData.data.length)
            }

        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProductData()
    }, [page, limit])

    const handleNext = () => {
        if (page !== totalPageCount) {
            setPage(preve => preve + 1)
        }
    }
    const handlePrevious = () => {
        if (page > 1) {
            setPage(preve => preve - 1)
        }
    }

    const handleOnChange = (e) => {
        const { value } = e.target
        setSearch(value)
        setPage(1)
    }

    const clearSearch = () => {
        setSearch("")
        setPage(1)
    }

    useEffect(() => {
        let flag = true

        const interval = setTimeout(() => {
            if (flag) {
                fetchProductData()
                flag = false
            }
        }, 300)

        return () => {
            clearTimeout(interval)
        }
    }, [search])

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = []
        const maxVisiblePages = 5
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
        let endPage = Math.min(totalPageCount, startPage + maxVisiblePages - 1)

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }
        return pages
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Box className="text-red-500" size={28} />
                            Products
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manage your product catalog
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchProductData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats & Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products by name..."
                            value={search}
                            onChange={handleOnChange}
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                        />
                        {search && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value))
                                setPage(1)
                            }}
                            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all text-sm"
                        >
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                            <option value={96}>96</option>
                        </select>
                    </div>

                    {/* View Toggle */}
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
                            <LayoutList size={18} />
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-gray-600">
                            <Package size={14} className="text-gray-400" />
                            <span className="font-medium">{totalCount || productData.length}</span> products
                        </span>
                        {search && (
                            <span className="text-gray-500">
                                • Showing results for "{search}"
                            </span>
                        )}
                    </div>
                    <span className="text-gray-500">
                        Page {page} of {totalPageCount}
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading products...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && productData.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <PackageSearch size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {search ? 'No products found' : 'No products yet'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                        {search
                            ? `No products match "${search}"`
                            : 'Start by uploading your first product'
                        }
                    </p>
                    {search && (
                        <button
                            onClick={clearSearch}
                            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            <X size={16} />
                            Clear Search
                        </button>
                    )}
                </div>
            )}

            {/* Products Grid */}
            {!loading && productData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    }>
                        {productData.map((p, index) => (
                            <ProductCardAdmin
                                key={p._id + index}
                                data={p}
                                fetchProductData={fetchProductData}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPageCount > 1 && (
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                            {/* Page Info */}
                            <div className="text-sm text-gray-500">
                                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount || productData.length)} of {totalCount || productData.length} products
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevious}
                                    disabled={page === 1}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {/* Page Numbers */}
                                <div className="hidden sm:flex items-center gap-1">
                                    {page > 3 && totalPageCount > 5 && (
                                        <>
                                            <button
                                                onClick={() => setPage(1)}
                                                className="w-10 h-10 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                1
                                            </button>
                                            {page > 4 && <span className="px-1 text-gray-400">...</span>}
                                        </>
                                    )}

                                    {getPageNumbers().map(pageNum => (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${page === pageNum
                                                ? 'bg-gray-900 text-white'
                                                : 'hover:bg-gray-100'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    {page < totalPageCount - 2 && totalPageCount > 5 && (
                                        <>
                                            {page < totalPageCount - 3 && <span className="px-1 text-gray-400">...</span>}
                                            <button
                                                onClick={() => setPage(totalPageCount)}
                                                className="w-10 h-10 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                {totalPageCount}
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Mobile Page Display */}
                                <div className="sm:hidden px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                                    {page} / {totalPageCount}
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={page === totalPageCount}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ProductAdmin
