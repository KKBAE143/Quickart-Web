import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { toast } from 'react-hot-toast';

const ProductFilters = ({ filters, onFiltersChange, categories = [], subCategories = [] }) => {
    const [brands, setBrands] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [expandedSections, setExpandedSections] = useState({
        price: true,
        brand: true,
        rating: true,
        availability: true,
        discount: true,
        category: false,
        subcategory: false
    });

    // Fetch brands and price range on mount
    useEffect(() => {
        fetchBrands();
        fetchPriceRange();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getAllBrands
            });
            if (response.data.success) {
                setBrands(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
        }
    };

    const fetchPriceRange = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getPriceRange
            });
            if (response.data.success) {
                setPriceRange(response.data.data);
                // Initialize filter price range if not set
                if (!filters.minPrice && !filters.maxPrice) {
                    onFiltersChange({
                        ...filters,
                        minPrice: response.data.data.minPrice,
                        maxPrice: response.data.data.maxPrice
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching price range:', error);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handlePriceChange = (type, value) => {
        const newFilters = { ...filters };
        if (type === 'min') {
            newFilters.minPrice = Number(value);
        } else {
            newFilters.maxPrice = Number(value);
        }
        onFiltersChange(newFilters);
    };

    const handleBrandToggle = (brand) => {
        const currentBrands = filters.brands || [];
        const newBrands = currentBrands.includes(brand)
            ? currentBrands.filter(b => b !== brand)
            : [...currentBrands, brand];
        onFiltersChange({ ...filters, brands: newBrands });
    };

    const handleRatingChange = (rating) => {
        onFiltersChange({ 
            ...filters, 
            minRating: filters.minRating === rating ? undefined : rating 
        });
    };

    const handleAvailabilityToggle = () => {
        onFiltersChange({ 
            ...filters, 
            inStockOnly: !filters.inStockOnly 
        });
    };

    const handleDiscountChange = (discount) => {
        onFiltersChange({ 
            ...filters, 
            minDiscount: filters.minDiscount === discount ? undefined : discount 
        });
    };

    const handleCategoryToggle = (categoryId) => {
        const currentCategories = filters.categoryId || [];
        const newCategories = currentCategories.includes(categoryId)
            ? currentCategories.filter(c => c !== categoryId)
            : [...currentCategories, categoryId];
        onFiltersChange({ ...filters, categoryId: newCategories });
    };

    const handleSubCategoryToggle = (subCategoryId) => {
        const currentSubCategories = filters.subCategoryId || [];
        const newSubCategories = currentSubCategories.includes(subCategoryId)
            ? currentSubCategories.filter(s => s !== subCategoryId)
            : [...currentSubCategories, subCategoryId];
        onFiltersChange({ ...filters, subCategoryId: newSubCategories });
    };

    const clearAllFilters = () => {
        onFiltersChange({
            search: filters.search, // Keep search term
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
            brands: [],
            minRating: undefined,
            inStockOnly: false,
            minDiscount: undefined,
            categoryId: [],
            subCategoryId: []
        });
        toast.success('All filters cleared');
    };

    const hasActiveFilters = () => {
        return (
            (filters.brands && filters.brands.length > 0) ||
            filters.minRating ||
            filters.inStockOnly ||
            filters.minDiscount ||
            (filters.categoryId && filters.categoryId.length > 0) ||
            (filters.subCategoryId && filters.subCategoryId.length > 0) ||
            (filters.minPrice !== priceRange.min) ||
            (filters.maxPrice !== priceRange.max)
        );
    };

    const FilterSection = ({ title, expanded, onToggle, children }) => (
        <div className="border-b border-gray-200 pb-4 mb-4">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full text-left font-semibold text-gray-800 hover:text-red-600 transition-colors"
            >
                <span>{title}</span>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expanded && <div className="mt-3">{children}</div>}
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Filters</h3>
                {hasActiveFilters() && (
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                    >
                        <X size={16} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Price Range Filter */}
            <FilterSection
                title="Price Range"
                expanded={expandedSections.price}
                onToggle={() => toggleSection('price')}
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={filters.minPrice || priceRange.min}
                            onChange={(e) => handlePriceChange('min', e.target.value)}
                            min={priceRange.min}
                            max={filters.maxPrice || priceRange.max}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                            placeholder="Min"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            value={filters.maxPrice || priceRange.max}
                            onChange={(e) => handlePriceChange('max', e.target.value)}
                            min={filters.minPrice || priceRange.min}
                            max={priceRange.max}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                            placeholder="Max"
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        ₹{filters.minPrice || priceRange.min} - ₹{filters.maxPrice || priceRange.max}
                    </div>
                </div>
            </FilterSection>

            {/* Brand Filter */}
            {brands.length > 0 && (
                <FilterSection
                    title="Brand"
                    expanded={expandedSections.brand}
                    onToggle={() => toggleSection('brand')}
                >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map((brand) => (
                            <label
                                key={brand}
                                className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.brands?.includes(brand) || false}
                                    onChange={() => handleBrandToggle(brand)}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">{brand}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Rating Filter */}
            <FilterSection
                title="Customer Rating"
                expanded={expandedSections.rating}
                onToggle={() => toggleSection('rating')}
            >
                <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                        <label
                            key={rating}
                            className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition-colors"
                        >
                            <input
                                type="radio"
                                name="rating"
                                checked={filters.minRating === rating}
                                onChange={() => handleRatingChange(rating)}
                                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">
                                {rating}★ & above
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Availability Filter */}
            <FilterSection
                title="Availability"
                expanded={expandedSections.availability}
                onToggle={() => toggleSection('availability')}
            >
                <label className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition-colors">
                    <input
                        type="checkbox"
                        checked={filters.inStockOnly || false}
                        onChange={handleAvailabilityToggle}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                </label>
            </FilterSection>

            {/* Discount Filter */}
            <FilterSection
                title="Discount"
                expanded={expandedSections.discount}
                onToggle={() => toggleSection('discount')}
            >
                <div className="space-y-2">
                    {[50, 40, 30, 20, 10].map((discount) => (
                        <label
                            key={discount}
                            className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition-colors"
                        >
                            <input
                                type="radio"
                                name="discount"
                                checked={filters.minDiscount === discount}
                                onChange={() => handleDiscountChange(discount)}
                                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">
                                {discount}% or more
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Category Filter */}
            {categories.length > 0 && (
                <FilterSection
                    title="Category"
                    expanded={expandedSections.category}
                    onToggle={() => toggleSection('category')}
                >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {categories.map((category) => (
                            <label
                                key={category._id}
                                className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.categoryId?.includes(category._id) || false}
                                    onChange={() => handleCategoryToggle(category._id)}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">{category.name}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* SubCategory Filter */}
            {subCategories.length > 0 && (
                <FilterSection
                    title="SubCategory"
                    expanded={expandedSections.subcategory}
                    onToggle={() => toggleSection('subcategory')}
                >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {subCategories.map((subCategory) => (
                            <label
                                key={subCategory._id}
                                className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.subCategoryId?.includes(subCategory._id) || false}
                                    onChange={() => handleSubCategoryToggle(subCategory._id)}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">{subCategory.name}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}
        </div>
    );
};

export default ProductFilters;

