import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { Link, useParams } from 'react-router-dom'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from '../components/Loading'
import CardProduct from '../components/CardProduct'
import ProductFilters from '../components/ProductFilters'
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import { SlidersHorizontal, X } from 'lucide-react'
import SEO from '../components/SEO'

const ProductListPage = () => {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [totalPage, setTotalPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const params = useParams()
  const AllSubCategory = useSelector(state => state.product.allSubCategory)
  const AllCategory = useSelector(state => state.product.allCategory)
  const [DisplaySubCatory, setDisplaySubCategory] = useState([])

  // Sort and filter states
  const [sortBy, setSortBy] = useState('relevance')
  const [filters, setFilters] = useState({
    minPrice: undefined,
    maxPrice: undefined,
    brands: [],
    minRating: undefined,
    inStockOnly: false,
    minDiscount: undefined,
    categoryId: [],
    subCategoryId: []
  })

  const subCategory = params?.subCategory?.split("-")
  const subCategoryName = subCategory?.slice(0, subCategory?.length - 1)?.join(" ")

  const categoryId = params.category.split("-").slice(-1)[0]
  const subCategoryId = params.subCategory.split("-").slice(-1)[0]

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_low_high', label: 'Price: Low to High' },
    { value: 'price_high_low', label: 'Price: High to Low' },
    { value: 'rating_high_low', label: 'Rating: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'best_selling', label: 'Best Selling' },
    { value: 'discount_high_low', label: 'Discount: High to Low' }
  ]

  useEffect(() => {
    const fetchProductdata = async () => {
      try {
        setLoading(true)
        
        const requestData = {
          ...filters,
          categoryId: categoryId ? [categoryId] : filters.categoryId,
          subCategoryId: subCategoryId ? [subCategoryId] : filters.subCategoryId,
          page: page,
          limit: 12,
          sortBy: sortBy
        }
        
        console.log('🔍 Fetching products with:', requestData)
        
        const response = await Axios({
          ...SummaryApi.searchProductsWithFilters,
          data: requestData
        })

        const { data: responseData } = response
        
        console.log('✅ Response received:', responseData.data?.length, 'products')
        if (responseData.data?.length > 0) {
          console.log('First 3 prices:', responseData.data.slice(0, 3).map(p => ({ name: p.name, price: p.price })))
        }

        if (responseData.success) {
          if (responseData.page == 1) {
            setData(responseData.data)
          } else {
            setData((prevData) => [...prevData, ...responseData.data])
          }
          setTotalPage(responseData.totalPage || 1)
          setTotalCount(responseData.totalCount || 0)
        }
      } catch (error) {
        AxiosToastError(error)
      } finally {
        setLoading(false)
      }
    }

    fetchProductdata()
  }, [params, filters, sortBy, page, categoryId, subCategoryId])

  useEffect(() => {
    const sub = AllSubCategory.filter(s => {
      const filterData = s.category.some(el => {
        return el._id == categoryId
      })

      return filterData ? filterData : null
    })
    setDisplaySubCategory(sub)
  }, [params, AllSubCategory])

  const handleFiltersChange = (newFilters) => {
    setPage(1) // Reset page first
    setFilters(newFilters)
  }

  const handleSortChange = (e) => {
    const newSortBy = e.target.value
    console.log('📊 Sort changed to:', newSortBy)
    setPage(1) // Reset page first
    setSortBy(newSortBy)
  }

  const handleLoadMore = () => {
    if (page < totalPage) {
      setPage(page + 1)
    }
  }

  return (
    <section className='sticky top-24 lg:top-20 bg-gray-50'>
      <SEO
        title={subCategoryName || 'Products'}
        description={`Shop ${subCategoryName || 'products'} online on Quickart. Wide selection, best prices, and 10-minute delivery.`}
        url={window.location.pathname}
        type="collection"
        category={subCategoryName}
      />
      <div className='container sticky top-24 mx-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4'>
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='lg:hidden fixed bottom-4 right-4 z-50 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all'
          >
            <SlidersHorizontal size={24} />
          </button>

          {/* Filters Sidebar */}
          <div className={`
            fixed lg:sticky top-20 left-0 h-screen lg:h-auto w-80 lg:w-full bg-white lg:bg-transparent
            z-40 lg:z-auto transition-transform duration-300
            ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className='lg:hidden flex items-center justify-between p-4 border-b'>
              <h3 className='font-bold text-lg'>Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X size={24} />
              </button>
            </div>
            <div className='h-[calc(100vh-80px)] lg:h-auto overflow-y-auto p-4 lg:p-0'>
              <ProductFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={AllCategory}
                subCategories={DisplaySubCatory}
              />
            </div>
          </div>

          {/* Overlay for mobile */}
          {showFilters && (
            <div
              className='lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30'
              onClick={() => setShowFilters(false)}
            />
          )}

          {/**Product Section **/}
          <div className=''>
            {/* Header with title and sort */}
            <div className='bg-white shadow-md p-3 md:p-4 rounded-lg mb-4'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div>
                  <h3 className='font-semibold text-base md:text-lg text-gray-800 capitalize'>
                    {subCategoryName}
                  </h3>
                  <p className='text-xs md:text-sm text-gray-600 mt-1'>
                    {totalCount} {totalCount === 1 ? 'product' : 'products'} found
                  </p>
                </div>

                {/* Sort Dropdown */}
                <div className='flex items-center gap-2'>
                  <label className='text-sm text-gray-600 whitespace-nowrap'>Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm'
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className='bg-white rounded-lg shadow-md p-2 sm:p-3 md:p-4'>
              <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4'>
                {
                  data.map((p, index) => {
                    return (
                      <CardProduct
                        data={p}
                        key={p._id + "productSubCategory" + index}
                      />
                    )
                  })
                }
              </div>
              
              {/* Load More Button */}
              {!loading && data.length > 0 && page < totalPage && (
                <div className='flex justify-center mt-6'>
                  <button
                    onClick={handleLoadMore}
                    className='px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all shadow-lg hover:shadow-xl'
                  >
                    Load More Products
                  </button>
                </div>
              )}
              
              {/* No products found */}
              {!loading && data.length === 0 && (
                <div className='flex flex-col items-center justify-center h-[60vh] text-center px-4'>
                  <p className='text-gray-500 text-lg'>No products found</p>
                  <p className='text-gray-400 text-sm mt-2'>Try adjusting your filters or selecting a different category</p>
                </div>
              )}

              {/* Loading */}
              {loading && <Loading />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductListPage
