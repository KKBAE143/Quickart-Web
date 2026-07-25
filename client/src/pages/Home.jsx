import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import {Link, useNavigate} from 'react-router-dom'
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay'
import RecommendedProducts from '../components/RecommendedProducts'
import RecentlyViewed from '../components/RecentlyViewed'
import SEO from '../components/SEO'

const Home = () => {
  const loadingCategory = useSelector(state => state.product.loadingCategory)
  const categoryData = useSelector(state => state.product.allCategory)
  const subCategoryData = useSelector(state => state.product.allSubCategory)
  const user = useSelector(state => state.user)
  const navigate = useNavigate()

  // Redirect riders to their dashboard
  useEffect(() => {
    if (user?.role === 'DELIVERY_AGENT') {
      navigate('/delivery', { replace: true })
    }
  }, [user, navigate])

  const handleRedirectProductListpage = (id,cat)=>{
      console.log(id,cat)
      const subcategory = subCategoryData.find(sub =>{
        const filterData = sub.category.some(c => {
          return c._id == id
        })

        return filterData ? true : null
      })
      const url = `/${valideURLConvert(cat)}-${id}/${valideURLConvert(subcategory.name)}-${subcategory._id}`

      navigate(url)
      console.log(url)
  }


  const handleBannerClick = () => {
    // Redirect to the first category if available, or to search page
    if (categoryData && categoryData.length > 0) {
      const firstCategory = categoryData[0]
      handleRedirectProductListpage(firstCategory._id, firstCategory.name)
    } else {
      navigate('/search')
    }
  }

  return (
   <section className='bg-gray-50'>
      <SEO
        title="Online Grocery Shopping - Fresh & Fast Delivery"
        description="Quickart — Order groceries, essentials, and more online with 10-minute delivery in your city. Best prices, wide assortment, and superfast delivery from dark stores near you."
      />
      {/* Hero Banner */}
      <div className='container mx-auto px-2 md:px-4 py-3 md:py-4'>
          <div 
            onClick={handleBannerClick}
            className='w-full h-full rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.01] md:hover:scale-[1.02] overflow-hidden'
          >
              <img
                src="/IMG_20251102_183709.jpg"
                className='w-full h-full object-cover' 
                alt='Quickart Fresh & Fast - Delivering essentials right to door' 
              />
          </div>
      </div>
      
      {/* Categories Grid */}
      <div className='container mx-auto px-2 md:px-4 my-2 md:my-4'>
          <h2 className='text-lg md:text-2xl font-bold text-red-700 mb-2 md:mb-4 px-1'>Shop by Category</h2>
          {/* Mobile: Horizontal scroll with larger items */}
          <div className='md:hidden overflow-x-auto scrollbar-none -mx-2 px-2'>
            <div className='flex gap-2 pb-2' style={{ width: 'max-content' }}>
              {loadingCategory ? (
                new Array(8).fill(null).map((c,index)=>{
                  return(
                    <div key={index+"loadingcategory"} className='bg-white rounded-xl p-2.5 min-w-[80px] grid gap-2 shadow-sm animate-pulse'>
                      <div className='bg-gray-100 h-16 w-16 rounded-lg'></div>
                      <div className='bg-gray-100 h-3 rounded w-14'></div>
                    </div>
                  )
                })
              ) : (
                categoryData.map((cat,index)=>{
                  return(
                    <div 
                      key={cat._id+"displayCategoryMobile"} 
                      className='bg-white rounded-xl p-2 cursor-pointer hover:shadow-lg active:scale-95 transition-all duration-200 shadow-sm border border-gray-100 flex flex-col items-center min-w-[76px]' 
                      onClick={()=>handleRedirectProductListpage(cat._id,cat.name)}
                    >
                      <div className='w-14 h-14 flex items-center justify-center mb-1.5 bg-gray-50 rounded-lg'>
                          <img 
                            src={cat.image}
                            alt={cat.name}
                            className='w-12 h-12 object-contain'
                            loading="lazy"
                          />
                      </div>
                      <p className='text-[10px] text-center font-medium text-gray-700 line-clamp-2 leading-tight'>{cat.name}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
          {/* Desktop/Tablet: Grid layout */}
          <div className='hidden md:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3'>
          {
            loadingCategory ? (
              new Array(12).fill(null).map((c,index)=>{
                return(
                  <div key={index+"loadingcategory"} className='bg-white rounded-lg p-2 md:p-3 min-h-24 md:min-h-32 grid gap-2 shadow animate-pulse'>
                    <div className='bg-gray-200 min-h-16 md:min-h-20 rounded'></div>
                    <div className='bg-gray-200 h-4 md:h-6 rounded'></div>
                  </div>
                )
              })
            ) : (
              categoryData.map((cat,index)=>{
                return(
                  <div 
                    key={cat._id+"displayCategory"} 
                    className='bg-white rounded-lg p-2 md:p-3 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-red-200' 
                    onClick={()=>handleRedirectProductListpage(cat._id,cat.name)}
                  >
                    <div className='w-full aspect-square flex items-center justify-center mb-1 md:mb-2'>
                        <img 
                          src={cat.image}
                          alt={cat.name}
                          className='w-full h-full object-scale-down'
                        />
                    </div>
                    <p className='text-xs md:text-sm text-center font-medium text-gray-700 line-clamp-2'>{cat.name}</p>
                  </div>
                )
              })
              
            )
          }
          </div>
      </div>

      {/***display category product */}
      <div className='bg-white py-4'>
        {
          categoryData?.map((c,index)=>{
            return(
              <CategoryWiseProductDisplay 
                key={c?._id+"CategorywiseProduct"} 
                id={c?._id} 
                name={c?.name}
              />
            )
          })
        }
      </div>

      {/* Recommendations Section */}
      <div className='container mx-auto px-3 md:px-4 lg:px-6 py-6 md:py-8 space-y-8'>
        {/* Trending Products */}
        <RecommendedProducts
          type="trending"
          limit={20}
          title="🔥 Trending Now"
          className="bg-gradient-to-r from-red-50 to-orange-50 -mx-3 md:-mx-4 lg:-mx-6 px-3 md:px-4 lg:px-6 py-6 rounded-xl"
        />

        {/* Recommended For You (Personalized) */}
        <RecommendedProducts
          type="for-you"
          limit={15}
          title="✨ Recommended For You"
        />

        {/* Recently Viewed Products */}
        <RecentlyViewed
          limit={10}
          title="👁️ Continue Shopping - Recently Viewed"
        />
      </div>

   </section>
  )
}

export default Home
