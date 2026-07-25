import React, { useEffect, useRef, useState } from 'react'
import { Link, } from 'react-router-dom'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import CardLoading from './CardLoading'
import CardProduct from './CardProduct'
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'

const CategoryWiseProductDisplay = ({ id, name }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const containerRef = useRef()
    const subCategoryData = useSelector(state => state.product.allSubCategory)
    const loadingCardNumber = new Array(6).fill(null)

    const fetchCategoryWiseProduct = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getProductByCategory,
                data: {
                    id: id
                }
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
        fetchCategoryWiseProduct()
    }, [])

    const handleScrollRight = () => {
        containerRef.current.scrollLeft += 200
    }

    const handleScrollLeft = () => {
        containerRef.current.scrollLeft -= 200
    }

    

  

  const handleRedirectProductListpage = ()=>{
      const subcategory = subCategoryData.find(sub =>{
        const filterData = sub.category.some(c => {
          return c._id == id
        })

        return filterData ? true : null
      })
      const url = `/${valideURLConvert(name)}-${id}/${valideURLConvert(subcategory?.name)}-${subcategory?._id}`

      return url
  }

  const redirectURL =  handleRedirectProductListpage()
    return (
        <div className='mb-2 md:mb-0'>
            <div className='container mx-auto p-3 md:p-4 flex items-center justify-between gap-4'>
                <h3 className='font-semibold text-base md:text-xl'>{name}</h3>
                <Link  to={redirectURL} className='text-cardinal hover:text-primary-100 text-sm md:text-base'>See All</Link>
            </div>
            <div className='relative flex items-center'>
                <div className='flex gap-2.5 md:gap-6 lg:gap-8 container mx-auto px-3 md:px-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory pb-2' ref={containerRef}>
                    {loading &&
                        loadingCardNumber.map((_, index) => {
                            return (
                                <CardLoading key={"CategorywiseProductDisplay123" + index} />
                            )
                        })
                    }


                    {
                        data.map((p, index) => {
                            return (
                                <div key={p._id + "CategorywiseProductDisplay" + index} className='snap-start'>
                                    <CardProduct
                                        data={p}
                                    />
                                </div>
                            )
                        })
                    }

                </div>
                {/* Scroll Buttons - Now visible on all screen sizes */}
                <div className='w-full left-0 right-0 container mx-auto px-2 absolute hidden md:flex justify-between pointer-events-none'>
                    <button 
                        onClick={handleScrollLeft} 
                        className='z-10 relative bg-white hover:bg-gray-100 shadow-lg text-lg p-2 rounded-full pointer-events-auto'
                        aria-label={`Scroll left to view more ${name} products`}
                        title="Previous"
                    >
                        <FaAngleLeft />
                    </button>
                    <button 
                        onClick={handleScrollRight} 
                        className='z-10 relative  bg-white hover:bg-gray-100 shadow-lg p-2 text-lg rounded-full pointer-events-auto'
                        aria-label={`Scroll right to view more ${name} products`}
                        title="Next"
                    >
                        <FaAngleRight />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CategoryWiseProductDisplay
