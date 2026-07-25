import React, { useEffect, useState } from 'react'
import CardLoading from '../components/CardLoading'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import CardProduct from '../components/CardProduct'
import ProductFilters from '../components/ProductFilters'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useLocation } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import noDataImage from '../assets/nothing here yet.webp'
import SEO from '../components/SEO'

const SearchPage = () => {
  const [data,setData] = useState([])
  const [loading,setLoading] = useState(true)
  const loadingArrayCard = new Array(10).fill(null)
  const [page,setPage] = useState(1)
  const [totalPage,setTotalPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const params = useLocation()
  const searchText = params?.search?.slice(3)
  const AllCategory = useSelector(state => state.product.allCategory)
  const AllSubCategory = useSelector(state => state.product.allSubCategory)

  // Sort and filter states
  const [sortBy, setSortBy] = useState('relevance')
  const [filters, setFilters] = useState({
    search: searchText,
    minPrice: undefined,
    maxPrice: undefined,
    brands: [],
    minRating: undefined,
    inStockOnly: false,
    minDiscount: undefined,
    categoryId: [],
    subCategoryId: []
  })

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_low_high', label: 'Price: Low to High' },
    { value: 'price_high_low', label: 'Price: High to Low' },
    { value: 'rating_high_low', label: 'Rating: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'best_selling', label: 'Best Selling' },
    { value: 'discount_high_low', label: 'Discount: High to Low' }
  ]

  useEffect(()=>{
    setPage(1) // Reset page when search text changes
    setFilters(prev => ({ ...prev, search: searchText }))
  },[searchText])

  useEffect(()=>{
    const fetchData = async() => {
      try {
        setLoading(true)
          const response = await Axios({
              ...SummaryApi.searchProductsWithFilters,
              data : {
                ...filters,
                search : searchText,
                page : page,
                limit: 12,
                sortBy: sortBy
              }
          })

          const { data : responseData } = response

          if(responseData.success){
              if(responseData.page == 1){
                setData(responseData.data)
              }else{
                setData((preve)=>{
                  return[
                    ...preve,
                    ...responseData.data
                  ]
                })
              }
              setTotalPage(responseData.totalPage || 1)
              setTotalCount(responseData.totalCount || 0)
          }
      } catch (error) {
          AxiosToastError(error)
      }finally{
        setLoading(false)
      }
    }

    fetchData()
  },[page, filters, sortBy, searchText])

  const handleFetchMore = ()=>{
    if(totalPage > page){
      setPage(preve => preve + 1)
    }
  }

  const handleFiltersChange = (newFilters) => {
    setPage(1) // Reset page first
    setFilters(newFilters)
  }

  const handleSortChange = (e) => {
    setPage(1) // Reset page first
    setSortBy(e.target.value)
  }

  return (
    <section className='bg-gray-50 min-h-screen pt-20'>
      <SEO
        title={searchText ? `Search results for "${searchText}"` : 'Search Products'}
        description={searchText ? `Find "${searchText}" on Quickart. Shop groceries, essentials, and more with fast delivery.` : 'Search for groceries, essentials, and more on Quickart.'}
        url={window.location.pathname}
        noindex={true}
      />
      <div className='container mx-auto p-3 md:p-4'>
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
                subCategories={AllSubCategory}
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

          {/* Main Content */}
          <div>
            {/* Search Header with Sort */}
            <div className='bg-white rounded-xl shadow-md p-4 md:p-5 mb-4 border-b-2 border-red-100'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
                <div>
                  <h1 className='text-xl md:text-2xl font-bold text-red-700 mb-2'>
                    Search Results
                  </h1>
                  <p className='text-sm md:text-base text-gray-600'>
                    {searchText && (
                      <span>Showing results for <span className='font-semibold text-red-600'>"{searchText}"</span></span>
                    )}
                  </p>
                  <p className='text-xs md:text-sm text-gray-500 mt-2'>
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

            {/* Products Grid with Infinite Scroll */}
            <InfiniteScroll
              dataLength={data.length}
              hasMore={totalPage > page}
              next={handleFetchMore}
              loader={<p className='text-center text-gray-500 py-4'>Loading more...</p>}
            >
              <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'>
                {
                  data.map((p,index)=>{
                    return(
                      <CardProduct data={p} key={p?._id+"searchProduct"+index}/>
                    )
                  })
                }

                {/***loading data */}
                {
                  loading && (
                    loadingArrayCard.map((_,index)=>{
                      return(
                        <CardLoading key={"loadingsearchpage"+index}/>
                      )
                    })
                  )
                }
              </div>
            </InfiniteScroll>

            {/* No data */}
            {
              !data[0] && !loading && (
                <div className='flex flex-col justify-center items-center w-full mx-auto py-8 md:py-12 bg-white rounded-xl shadow-md mt-4'>
                  <img
                    src={noDataImage} 
                    alt='No results found'
                    className='w-full h-full max-w-xs max-h-xs block'
                  />
                  <p className='font-semibold text-lg md:text-xl text-gray-700 my-2'>No products found</p>
                  <p className='text-sm text-gray-500'>Try adjusting your filters or searching with different keywords</p>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </section>
  )
}

export default SearchPage
