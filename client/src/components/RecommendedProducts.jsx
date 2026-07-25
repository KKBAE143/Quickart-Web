import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import CardProduct from './CardProduct';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const RecommendedProducts = ({ 
    type = 'similar', 
    productId = null, 
    categoryId = null,
    limit = 10,
    title = 'Recommended Products',
    className = ''
}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrollPosition, setScrollPosition] = useState(0);
    const containerRef = React.useRef(null);

    useEffect(() => {
        fetchRecommendations();
    }, [type, productId, categoryId, limit]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            let response;

            switch (type) {
                case 'similar':
                    if (!productId) return;
                    response = await Axios({
                        ...SummaryApi.getSimilarProducts,
                        url: SummaryApi.getSimilarProducts.url.replace(':productId', productId),
                        params: { limit }
                    });
                    break;

                case 'frequently-bought-together':
                    if (!productId) return;
                    response = await Axios({
                        ...SummaryApi.getFrequentlyBoughtTogether,
                        url: SummaryApi.getFrequentlyBoughtTogether.url.replace(':productId', productId),
                        params: { limit }
                    });
                    break;

                case 'trending':
                    response = await Axios({
                        ...SummaryApi.getTrendingProducts,
                        params: { limit, categoryId }
                    });
                    break;

                case 'for-you':
                    response = await Axios({
                        ...SummaryApi.getRecommendedForYou,
                        params: { limit }
                    });
                    break;

                case 'category':
                    if (!categoryId) return;
                    response = await Axios({
                        ...SummaryApi.getCategoryRecommendations,
                        url: SummaryApi.getCategoryRecommendations.url.replace(':categoryId', categoryId),
                        params: { limit }
                    });
                    break;

                default:
                    console.error('Invalid recommendation type:', type);
                    return;
            }

            if (response.data.success) {
                setProducts(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            // Silent fail - don't show error toast as this is not critical
        } finally {
            setLoading(false);
        }
    };

    const scroll = (direction) => {
        const container = containerRef.current;
        if (!container) return;

        const scrollAmount = 300;
        const newPosition = direction === 'left' 
            ? scrollPosition - scrollAmount 
            : scrollPosition + scrollAmount;

        container.scrollTo({
            left: newPosition,
            behavior: 'smooth'
        });

        setScrollPosition(newPosition);
    };

    const handleScroll = () => {
        if (containerRef.current) {
            setScrollPosition(containerRef.current.scrollLeft);
        }
    };

    if (loading) {
        return (
            <div className={`py-8 ${className}`}>
                <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">{title}</h2>
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-red-600" size={40} />
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return null; // Don't show section if no products
    }

    return (
        <div className={`py-6 md:py-8 ${className}`}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-semibold text-gray-800">
                    {title}
                </h2>
                
                {/* Navigation Arrows (Desktop) */}
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={scrollPosition <= 0}
                        className="p-2 rounded-full bg-white border border-gray-300 hover:bg-red-50 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="text-gray-600" size={20} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-full bg-white border border-gray-300 hover:bg-red-50 hover:border-red-600 transition-all duration-200"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="text-gray-600" size={20} />
                    </button>
                </div>
            </div>

            {/* Products Container */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {products.map((product) => (
                    <div 
                        key={product._id} 
                        className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[220px]"
                    >
                        <CardProduct data={product} />
                    </div>
                ))}
            </div>

            {/* Mobile: Scroll indicator */}
            <div className="md:hidden flex justify-center gap-1 mt-4">
                {Array.from({ length: Math.ceil(products.length / 2) }).map((_, index) => (
                    <div
                        key={index}
                        className={`h-1 rounded-full transition-all duration-300 ${
                            Math.floor(scrollPosition / 200) === index
                                ? 'w-6 bg-red-600'
                                : 'w-2 bg-gray-300'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecommendedProducts;

