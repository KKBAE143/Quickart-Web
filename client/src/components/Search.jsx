import { useEffect, useState } from 'react'
import { IoSearch, IoMic } from "react-icons/io5";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import { FaArrowLeft } from "react-icons/fa";
import useMobile from '../hooks/useMobile';


const Search = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [isSearchPage,setIsSearchPage] = useState(false)
    const [ isMobile ] = useMobile()
    const params = useLocation()
    const searchText = params.search.slice(3)

    useEffect(()=>{
        const isSearch = location.pathname === "/search"
        setIsSearchPage(isSearch)
    },[location])


    const redirectToSearchPage = ()=>{
        navigate("/search")
    }

    const handleOnChange = (e)=>{
        const value = e.target.value
        const url = `/search?q=${value}`
        navigate(url)
    }

  return (
    <div className='w-full min-w-0 lg:min-w-[420px] h-10 lg:h-11 rounded-full border border-gray-200 overflow-hidden flex items-center text-neutral-600 bg-gray-50 group focus-within:border-red-500 focus-within:bg-white focus-within:shadow-md focus-within:shadow-red-500/10 transition-all duration-200'>
        <div className='flex-shrink-0'>
            {
                (isMobile && isSearchPage ) ? (
                    <Link to={"/"} className='flex justify-center items-center h-10 w-10 group-focus-within:text-red-600 text-gray-500 hover:text-red-600 transition-all duration-200'>
                        <FaArrowLeft size={18}/>
                    </Link>
                ) :(
                    <button 
                        className='flex justify-center items-center h-10 w-10 group-focus-within:text-red-600 text-red-600 transition-colors duration-200'
                        aria-label="Search for products"
                        title="Search"
                    >
                        <IoSearch size={20}/>
                    </button>
                )
            }
        </div>
        <div className='flex-1 h-full min-w-0'>
            {
                !isSearchPage ? (
                     //not in search page
                     <div onClick={redirectToSearchPage} className='w-full h-full flex items-center cursor-pointer'>
                        <TypeAnimation
                                sequence={[
                                    'Search "milk"',
                                    1000,
                                    'Search "bread"',
                                    1000,
                                    'Search "sugar"',
                                    1000,
                                    'Search "paneer"',
                                    1000,
                                    'Search "chocolate"',
                                    1000,
                                    'Search "curd"',
                                    1000,
                                    'Search "rice"',
                                    1000,
                                    'Search "egg"',
                                    1000,
                                    'Search "chips"',
                                ]}
                                wrapper="span"
                                speed={50}
                                repeat={Infinity}
                                className='text-gray-400 text-sm font-medium truncate'
                            />
                     </div>
                ) : (
                    //when i was search page
                    <div className='w-full h-full'>
                        <input
                            type='text'
                            placeholder='Search for atta, dal...'
                            autoFocus
                            defaultValue={searchText}
                            className='bg-transparent w-full h-full outline-none text-gray-800 text-sm font-medium placeholder:text-gray-400 pr-2'
                            onChange={handleOnChange}
                        />
                    </div>
                )
            }
        </div>
        {/* Voice search hint icon */}
        {!isSearchPage && (
            <div className='flex-shrink-0 pr-2'>
                <button 
                    className='flex justify-center items-center h-8 w-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200'
                    aria-label="Voice search"
                    title="Voice search"
                    onClick={redirectToSearchPage}
                >
                    <IoMic size={18}/>
                </button>
            </div>
        )}
    </div>
  )
}

export default Search
