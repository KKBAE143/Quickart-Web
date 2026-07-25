import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import { FaAngleRight,FaAngleLeft } from "react-icons/fa6";
import { FaShoppingBag, FaTag, FaBox } from "react-icons/fa";
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import Divider from '../components/Divider'
import image1 from '../assets/minute_delivery.png'
import image2 from '../assets/Best_Prices_Offers.png'
import image3 from '../assets/Wide_Assortment.png'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton'
// HIDDEN: Reviews feature temporarily disabled
// import ReviewSummary from '../components/ReviewSummary'
// import ReviewList from '../components/ReviewList'
// import ReviewForm from '../components/ReviewForm'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { cleanImageArray, getSafeImageUrl } from '../utils/validateImageUrl'
import InnerImageZoom from 'react-inner-image-zoom'
import 'react-inner-image-zoom/lib/styles.min.css'
import { Heart } from 'lucide-react'
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice'
import RecommendedProducts from '../components/RecommendedProducts'
import RecentlyViewed, { addToRecentlyViewed } from '../components/RecentlyViewed'

const ProductDisplayPage = () => {
  const params = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  let productId = params?.product?.split("-")?.slice(-1)[0]
  const [data,setData] = useState({
    name : "",
    image : []
  })
  const [image,setImage] = useState(0)
  const [loading,setLoading] = useState(false)
  const imageContainer = useRef()
  // HIDDEN: Reviews feature temporarily disabled
  // const [showReviewForm, setShowReviewForm] = useState(false)
  // const [canReview, setCanReview] = useState(false)
  // const [reviewOrders, setReviewOrders] = useState([])
  // const [selectedOrder, setSelectedOrder] = useState(null)
  // const [reviewRefresh, setReviewRefresh] = useState(0)
  // const [checkingEligibility, setCheckingEligibility] = useState(false)
  const user = useSelector(state => state.user)
  // const reviewSectionRef = useRef(null)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const fetchProductDetails = async()=>{
    try {
        const response = await Axios({
          ...SummaryApi.getProductDetails,
          data : {
            productId : productId 
          }
        })

        const { data : responseData } = response

        if(responseData.success){
          // Clean and validate all image URLs before setting state
          const cleanedData = {
            ...responseData.data,
            image: cleanImageArray(responseData.data.image || [])
          };
          setData(cleanedData)
          
          // Add to recently viewed
          if (cleanedData._id) {
            addToRecentlyViewed(cleanedData)
          }
        }
    } catch (error) {
      AxiosToastError(error)
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    // Clear any cached review data that might have malformed URLs
    setShowReviewForm(false)
    setReviewOrders([])
    setSelectedOrder(null)
    
    // Fetch fresh product details
    fetchProductDetails()
    
    // Track product view for recommendations
    if (productId) {
      trackProductView()
    }
  },[params])
  
  const trackProductView = async () => {
    try {
      await Axios({
        ...SummaryApi.trackProductView,
        url: SummaryApi.trackProductView.url.replace(':productId', productId)
      })
    } catch (error) {
      // Silent fail - view tracking is not critical
      console.log('View tracking error:', error)
    }
  }

  useEffect(() => {
    if (user._id && productId) {
      // checkCanReview() // HIDDEN: Reviews feature temporarily disabled
      checkWishlistStatus()
    }
  }, [user._id, productId])

  const checkWishlistStatus = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.checkWishlist,
        url: `${SummaryApi.checkWishlist.url}/${productId}`
      })
      if (response.data.success) {
        setInWishlist(response.data.data.inWishlist)
      }
    } catch (error) {
      // Silently fail - not critical
    }
  }

  const handleWishlistToggle = async () => {
    if (!user?._id) {
      toast.error("Please login to add to wishlist")
      navigate('/login')
      return
    }

    setWishlistLoading(true)

    try {
      if (inWishlist) {
        // Remove from wishlist
        const response = await Axios({
          ...SummaryApi.removeFromWishlist,
          url: `${SummaryApi.removeFromWishlist.url}/${productId}`
        })
        if (response.data.success) {
          setInWishlist(false)
          dispatch(removeFromWishlist(productId))
          toast.success("Removed from wishlist")
        }
      } else {
        // Add to wishlist
        const response = await Axios({
          ...SummaryApi.addToWishlist,
          data: { productId: productId }
        })
        if (response.data.success) {
          setInWishlist(true)
          dispatch(addToWishlist(response.data.data))
          toast.success("Added to wishlist")
        }
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setWishlistLoading(false)
    }
  }

  // HIDDEN: Reviews feature temporarily disabled
  // const checkCanReview = async () => {
  //   try {
  //     setCheckingEligibility(true)
  //     const response = await Axios({
  //       method: 'get',
  //       url: `${SummaryApi.checkCanReview.url}/${productId}`
  //     })
  //
  //     if (response.data.success) {
  //       setCanReview(response.data.data.can_review)
  //       if (response.data.data.can_review && response.data.data.orders) {
  //         setReviewOrders(response.data.data.orders)
  //         setSelectedOrder(response.data.data.orders[0]?._id)
  //       }
  //     }
  //   } catch (error) {
  //     // Silently fail - user might not be logged in
  //     setCanReview(false)
  //   } finally {
  //     setCheckingEligibility(false)
  //   }
  // }

  // const scrollToReviews = () => {
  //   reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // }

  // const handleWriteReview = () => {
  //   if (!user._id) {
  //     toast.error('Please login to write a review')
  //     return
  //   }
  //   if (!canReview) {
  //     toast.error('You need to purchase this product first')
  //     return
  //   }
  //   setShowReviewForm(true)
  // }

  // const handleReviewSuccess = (review) => {
  //   setShowReviewForm(false)
  //   setCanReview(false)
  //   setReviewRefresh(prev => prev + 1)
  //   toast.success('Thank you for your review!')
  //   fetchProductDetails() // Refresh product to update rating stats
  // }
  
  const handleScrollRight = ()=>{
    imageContainer.current.scrollLeft += 100
  }
  const handleScrollLeft = ()=>{
    imageContainer.current.scrollLeft -= 100
  }
  console.log("product data",data)
  return (
    <>
    <section className='container mx-auto p-3 md:p-4 lg:p-6 grid lg:grid-cols-2 gap-4 lg:gap-6'>
        {/* Image Gallery */}
        <div className=''>
            <div className='bg-white lg:min-h-[65vh] lg:max-h-[65vh] rounded-xl min-h-[300px] md:min-h-[380px] w-full shadow-md border-2 border-gray-100 p-2 md:p-4 product-image-zoom'>
                <InnerImageZoom
                    src={data.image[image]}
                    zoomSrc={data.image[image]}
                    alt={data.name}
                    zoomScale={1.5}
                    zoomType="hover"
                />
            </div>
            
            {/* Image Dots Indicator */}
            <div className='flex items-center justify-center gap-2 md:gap-3 my-3 md:my-4'>
              {
                data.image.map((img,index)=>{
                  return(
                    <button
                      key={index+"point"}
                      onClick={() => setImage(index)}
                      className={`transition-all duration-300 rounded-full ${index === image ? "bg-red-600 w-4 h-4 md:w-6 md:h-6" : "bg-gray-300 w-3 h-3 md:w-4 md:h-4 hover:bg-gray-400"}`}
                      aria-label={`View image ${index + 1}`}
                    />
                  )
                })
              }
            </div>
            
            {/* Thumbnails */}
            <div className='grid relative'>
                <div ref={imageContainer} className='flex gap-2 md:gap-3 lg:gap-4 z-10 relative w-full overflow-x-auto scrollbar-none pb-2'>
                      {
                        data.image.map((img,index)=>{
                          return(
                            <div 
                              className={`w-16 h-16 md:w-20 md:h-20 min-h-16 min-w-16 md:min-h-20 md:min-w-20 cursor-pointer shadow-md rounded-lg border-2 transition-all duration-300 ${index === image ? 'border-red-600 shadow-lg' : 'border-gray-200 hover:border-red-300'}`} 
                              key={index+"thumbnail"}
                            >
                              <img
                                  src={img}
                                  alt={`${data.name} thumbnail ${index + 1}`}
                                  onClick={()=>setImage(index)}
                                  className='w-full h-full object-scale-down p-1' 
                              />
                            </div>
                          )
                        })
                      }
                </div>
                <div className='w-full -ml-3 h-full hidden lg:flex justify-between absolute items-center'>
                    <button 
                      onClick={handleScrollLeft} 
                      className='z-10 bg-white relative p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-red-50 text-red-600'
                      aria-label='Scroll thumbnails left'
                    >
                        <FaAngleLeft size={20}/>
                    </button>
                    <button 
                      onClick={handleScrollRight} 
                      className='z-10 bg-white relative p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-red-50 text-red-600'
                      aria-label='Scroll thumbnails right'
                    >
                        <FaAngleRight size={20}/>
                    </button>
                </div>
            </div>
            <div>
            </div>

            <div className='my-4  hidden lg:grid gap-3 '>
                <div>
                    <p className='font-semibold'>Description</p>
                    <p className='text-base'>{data.description}</p>
                </div>
                <div>
                    <p className='font-semibold'>Unit</p>
                    <p className='text-base'>{data.unit}</p>
                </div>
                {
                  data?.more_details && Object.keys(data?.more_details).map((element,index)=>{
                    return(
                      <div key={element+index+"details"}>
                          <p className='font-semibold'>{element}</p>
                          <p className='text-base'>{data?.more_details[element]}</p>
                      </div>
                    )
                  })
                }
            </div>
        </div>


        {/* Product Details */}
        <div className='p-4 md:p-5 lg:pl-7 bg-white rounded-xl shadow-md relative'>
            {/* Wishlist Heart Button - Top Right */}
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className='absolute top-4 right-4 p-2 md:p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-gray-100'
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart 
                size={24}
                className={`transition-all duration-300 ${
                  inWishlist 
                    ? 'fill-red-600 text-red-600' 
                    : 'text-gray-400 hover:text-red-600'
                }`}
              />
            </button>

            {/* Delivery Badge */}
            <span className='inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1 rounded-full text-xs md:text-sm font-semibold mb-3'>
              ⚡ 10 Min Delivery
            </span>
            
            {/* Product Name */}
            <h2 className='text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 pr-12'>{data.name}</h2>  
            <p className='text-sm md:text-base text-gray-600 mb-4'>{data.unit}</p> 
            
            <Divider/>
            
            {/* Price Section */}
            <div className='my-4'>
              <p className='text-sm text-gray-600 mb-2'>Price</p> 
              <div className='flex flex-wrap items-center gap-2 md:gap-3'>
                <div className='border-2 border-red-600 px-4 md:px-6 py-2 md:py-3 rounded-lg bg-red-50'>
                    <p className='font-bold text-xl md:text-2xl lg:text-3xl text-red-700'>
                      {DisplayPriceInRupees(pricewithDiscount(data.price,data.discount))}
                    </p>
                </div>
                {
                  data.discount && (
                    <p className='line-through text-gray-500 text-base md:text-lg'>{DisplayPriceInRupees(data.price)}</p>
                  )
                }
                {
                  data.discount && (
                    <span className='px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-full text-sm md:text-base'>
                      {data.discount}% OFF
                    </span>
                  )
                }
              </div>
            </div> 
              
            {/* Add to Cart / Out of Stock */}
            {
              data.stock === 0 ? (
                <div className='my-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg'>
                  <p className='text-base md:text-lg text-red-600 font-semibold text-center'>
                    😞 Out of Stock
                  </p>
                </div>
              ) 
              : (
                <div className='my-5'>
                  <AddToCartButton data={data}/>
                </div>
              )
            }
           
            <Divider/>

            {/* Why Shop Section */}
            <h2 className='font-bold text-lg md:text-xl text-gray-900 mb-4 mt-6'>
              <FaShoppingBag className='inline mr-2 text-red-600' /> Why shop from Quickart?
            </h2>
            <div className='space-y-4'>
                  <div className='flex items-start gap-3 md:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors duration-300'>
                      <img
                        src={image1}
                        alt='superfast delivery'
                        className='w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex-shrink-0'
                      />
                      <div className='text-xs md:text-sm'>
                        <div className='font-bold text-gray-900 mb-1 text-sm md:text-base'>⚡ Superfast Delivery</div>
                        <p className='text-gray-600'>Get your order delivered to your doorstep at the earliest from dark stores near you.</p>
                      </div>
                  </div>
                  <div className='flex items-start gap-3 md:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors duration-300'>
                      <img
                        src={image2}
                        alt='Best prices offers'
                        className='w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex-shrink-0'
                      />
                      <div className='text-xs md:text-sm'>
                        <div className='font-bold text-gray-900 mb-1 text-sm md:text-base flex items-center gap-2'>
                          <FaTag className='text-red-600' />
                          Best Prices & Offers
                        </div>
                        <p className='text-gray-600'>Best price destination with offers directly from the manufacturers.</p>
                      </div>
                  </div>
                  <div className='flex items-start gap-3 md:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors duration-300'>
                      <img
                        src={image3}
                        alt='Wide Assortment'
                        className='w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex-shrink-0'
                      />
                      <div className='text-xs md:text-sm'>
                        <div className='font-bold text-gray-900 mb-1 text-sm md:text-base flex items-center gap-2'>
                          <FaBox className='text-red-600' />
                          Wide Assortment
                        </div>
                        <p className='text-gray-600'>Choose from 5000+ products across food, personal care, household & other categories.</p>
                      </div>
                  </div>
            </div>

            {/****Product Details - Mobile */}
            <div className='my-6 grid gap-4 lg:hidden'>
                <div>
                    <p className='font-semibold'>Description</p>
                    <p className='text-base'>{data.description}</p>
                </div>
                <div>
                    <p className='font-semibold'>Unit</p>
                    <p className='text-base'>{data.unit}</p>
                </div>
                {
                  data?.more_details && Object.keys(data?.more_details).map((element,index)=>{
                    return(
                      <div key={element+index+"mobiledetails"}>
                          <p className='font-semibold'>{element}</p>
                          <p className='text-base'>{data?.more_details[element]}</p>
                      </div>
                    )
                  })
                }
            </div>

        </div>
    </section>

    {/* HIDDEN: Reviews Section - temporarily disabled */}
    {/* <section ref={reviewSectionRef} className='container mx-auto p-3 md:p-4 lg:p-6 space-y-6'>
      {canReview && !showReviewForm && (
        <div className='bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between'>
          <div>
            <h3 className='font-semibold text-gray-900'>Purchased this product?</h3>
            <p className='text-sm text-gray-600'>Share your experience to help others</p>
          </div>
          <button
            onClick={handleWriteReview}
            className='bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-300'
          >
            Write Review
          </button>
        </div>
      )}

      {showReviewForm && (
        <ReviewForm
          productId={productId}
          orderId={selectedOrder}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {data.review_stats && data.review_stats.total_reviews > 0 && (
        <ReviewSummary stats={data.review_stats} />
      )}

      {(!data.review_stats || data.review_stats.total_reviews === 0) && !showReviewForm && !canReview && (
        <div className='bg-gray-50 rounded-lg p-8 text-center border border-gray-200'>
          <p className='text-gray-600'>No reviews yet. Be the first to review this product!</p>
        </div>
      )}

      {data.review_stats && data.review_stats.total_reviews > 0 && (
        <div>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>Customer Reviews</h2>
          <ReviewList productId={productId} refreshTrigger={reviewRefresh} />
        </div>
      )}
    </section> */}

      {/* Recommendations Section */}
      <div className='container mx-auto p-3 md:p-4 lg:p-6 mt-12 space-y-8'>
        {/* Frequently Bought Together */}
        <RecommendedProducts
          type="frequently-bought-together"
          productId={productId}
          limit={5}
          title="Frequently Bought Together"
          className="bg-gradient-to-r from-red-50 to-orange-50 -mx-4 px-4 py-6 rounded-xl"
        />

        {/* Similar Products */}
        <RecommendedProducts
          type="similar"
          productId={productId}
          limit={10}
          title="Similar Products You May Like"
        />

        {/* Trending Products */}
        <RecommendedProducts
          type="trending"
          categoryId={data.category?.[0]?._id}
          limit={10}
          title="Trending in This Category"
        />
      </div>

      {/* Recently Viewed Products */}
      <div className='mt-8'>
        <RecentlyViewed
          currentProductId={productId}
          limit={10}
          title="Recently Viewed Products"
        />
      </div>
    </>
  )
}

export default ProductDisplayPage
