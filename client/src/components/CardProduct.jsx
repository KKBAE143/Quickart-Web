import React from 'react'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link, useNavigate } from 'react-router-dom'
import { valideURLConvert } from '../utils/valideURLConvert'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import AddToCartButton from './AddToCartButton'
import { FaStar } from 'react-icons/fa'
import { Heart } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice'

const CardProduct = ({data}) => {
    const url = `/product/${valideURLConvert(data.name)}-${data._id}`
    const [loading,setLoading] = useState(false)
    const [inWishlist, setInWishlist] = useState(false)
    const [wishlistLoading, setWishlistLoading] = useState(false)
    const user = useSelector(state => state.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    // Check if product is in wishlist on mount
    useEffect(() => {
        if (user?._id) {
            checkWishlistStatus()
        }
    }, [user, data._id])

    const checkWishlistStatus = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.checkWishlist,
                url: `${SummaryApi.checkWishlist.url}/${data._id}`
            })
            if (response.data.success) {
                setInWishlist(response.data.data.inWishlist)
            }
        } catch (error) {
            // Silently fail - not critical
        }
    }

    const handleWishlistToggle = async (e) => {
        e.preventDefault() // Prevent Link navigation
        e.stopPropagation()

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
                    url: `${SummaryApi.removeFromWishlist.url}/${data._id}`
                })
                if (response.data.success) {
                    setInWishlist(false)
                    dispatch(removeFromWishlist(data._id))
                    toast.success("Removed from wishlist")
                }
            } else {
                // Add to wishlist
                const response = await Axios({
                    ...SummaryApi.addToWishlist,
                    data: { productId: data._id }
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
  
  return (
    <Link to={url} className='border border-gray-100 py-2 px-1.5 lg:p-4 grid gap-1 lg:gap-3 min-w-[150px] lg:min-w-52 rounded-xl cursor-pointer bg-white hover:shadow-lg hover:border-red-200 transition-all duration-300 active:scale-[0.98] relative' >
      {/* Wishlist Heart Icon */}
      <button
        onClick={handleWishlistToggle}
        disabled={wishlistLoading}
        className='absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110'
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart 
          size={16}
          className={`transition-all duration-300 ${
            inWishlist 
              ? 'fill-red-600 text-red-600' 
              : 'text-gray-400 hover:text-red-600'
          }`}
        />
      </button>

      <div className='h-24 lg:h-28 w-full rounded overflow-hidden flex items-center justify-center bg-gray-50'>
            <img 
                src={data.image[0]}
                alt={data.name}
                className='w-full h-full object-contain transition-transform duration-300 hover:scale-110'
                loading="lazy"
            />
      </div>
      <div className='flex items-center gap-1'>
        <div className='rounded text-xs w-fit p-[1px] px-2 text-red-700 bg-red-50 font-semibold'>
              10 min 
        </div>
        <div>
            {
              Boolean(data.discount) && (
                <p className='text-white bg-gradient-to-r from-red-600 to-red-700 px-2 w-fit text-xs rounded-full font-semibold'>{data.discount}% OFF</p>
              )
            }
        </div>
      </div>
      <div className='px-2 lg:px-0 font-medium text-ellipsis text-sm lg:text-base line-clamp-2'>
        {data.name}
      </div>

      {/* HIDDEN: Rating Display - Reviews feature temporarily disabled */}
      {/* {data.review_stats && data.review_stats.total_reviews > 0 && (
        <div className='px-2 lg:px-0 flex items-center gap-2'>
          <div className='flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold'>
            <span>{data.review_stats.average_rating.toFixed(1)}</span>
            <FaStar className='text-xs' />
          </div>
          <span className='text-xs text-gray-500'>
            ({data.review_stats.total_reviews} {data.review_stats.total_reviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      )} */}

      <div className='w-fit gap-1 px-2 lg:px-0 text-sm lg:text-base'>
        {data.unit} 
        
      </div>

      <div className='px-2 lg:px-0 flex items-center justify-between gap-1 lg:gap-3 text-sm lg:text-base'>
        <div className='flex items-center gap-1'>
          <div className='font-semibold'>
              {DisplayPriceInRupees(pricewithDiscount(data.price,data.discount))} 
          </div>
          
          
        </div>
        <div className=''>
          {
            data.stock == 0 ? (
              <p className='text-red-500 text-sm text-center'>Out of stock</p>
            ) : (
              <AddToCartButton data={data} />
            )
          }
            
        </div>
      </div>

    </Link>
  )
}

export default CardProduct
