import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CardProduct from './CardProduct';

const STORAGE_KEY = 'quickart_recently_viewed';
const MAX_ITEMS = 20; // Store max 20 recently viewed products

// Helper functions for localStorage management
export const addToRecentlyViewed = (product) => {
    try {
        // Get existing recently viewed items
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // Remove if already exists (to add to front)
        const filtered = existing.filter(item => item._id !== product._id);
        
        // Add to front
        const updated = [product, ...filtered];
        
        // Keep only MAX_ITEMS
        const trimmed = updated.slice(0, MAX_ITEMS);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        
        return trimmed;
    } catch (error) {
        console.error('Error adding to recently viewed:', error);
        return [];
    }
};

export const getRecentlyViewed = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
        console.error('Error getting recently viewed:', error);
        return [];
    }
};

export const clearRecentlyViewed = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing recently viewed:', error);
        return false;
    }
};

const RecentlyViewed = ({ currentProductId = null, limit = 10, title = "Recently Viewed" }) => {
    const [products, setProducts] = useState([]);
    const [scrollPosition, setScrollPosition] = useState(0);
    const containerRef = React.useRef(null);

    useEffect(() => {
        loadRecentlyViewed();
    }, []);

    const loadRecentlyViewed = () => {
        const recentProducts = getRecentlyViewed();
        
        // Filter out current product if viewing a product page
        const filtered = currentProductId 
            ? recentProducts.filter(p => p._id !== currentProductId)
            : recentProducts;
        
        // Apply limit
        const limited = filtered.slice(0, limit);
        
        setProducts(limited);
    };

    const handleScroll = (direction) => {
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

    const canScrollLeft = scrollPosition > 0;
    const canScrollRight = () => {
        const container = containerRef.current;
        if (!container) return false;
        return scrollPosition < (container.scrollWidth - container.clientWidth - 10);
    };

    // Don't render if no products
    if (products.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                    {title}
                </h2>
                
                {/* Desktop Navigation Arrows */}
                <div className="hidden md:flex items-center gap-2">
                    <button
                        onClick={() => handleScroll('left')}
                        disabled={!canScrollLeft}
                        className={`p-2 rounded-full border transition-all ${
                            canScrollLeft
                                ? 'border-red-600 text-red-600 hover:bg-red-50'
                                : 'border-gray-300 text-gray-300 cursor-not-allowed'
                        }`}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => handleScroll('right')}
                        disabled={!canScrollRight()}
                        className={`p-2 rounded-full border transition-all ${
                            canScrollRight()
                                ? 'border-red-600 text-red-600 hover:bg-red-50'
                                : 'border-gray-300 text-gray-300 cursor-not-allowed'
                        }`}
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Products Carousel */}
            <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={(e) => setScrollPosition(e.target.scrollLeft)}
            >
                {products.map((product) => (
                    <div 
                        key={product._id} 
                        className="flex-shrink-0 w-48 sm:w-56"
                    >
                        <CardProduct data={product} />
                    </div>
                ))}
            </div>

            {/* Mobile Scroll Indicators */}
            <div className="flex md:hidden justify-center gap-1 mt-4">
                {Array.from({ length: Math.ceil(products.length / 2) }).map((_, index) => (
                    <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                            Math.floor(scrollPosition / 300) === index
                                ? 'w-8 bg-red-600'
                                : 'w-1.5 bg-gray-300'
                        }`}
                    />
                ))}
            </div>

            {/* Continue Shopping Text */}
            <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                    Pick up where you left off
                </p>
            </div>
        </div>
    );
};

export default RecentlyViewed;

