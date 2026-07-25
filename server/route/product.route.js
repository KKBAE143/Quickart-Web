import { Router } from 'express'
import auth from '../middleware/auth.js'
import { createProductController, deleteProductDetails, getProductByCategory, getProductByCategoryAndSubCategory, getProductController, getProductDetails, searchProduct, updateProductDetails, getProductsWithFilters, getAllBrands, getPriceRange } from '../controllers/product.controller.js'
import { admin } from '../middleware/Admin.js'
import { rateLimitAdmin, rateLimitProductBrowsing, rateLimitSearch } from '../middleware/rateLimiter.js'

const productRouter = Router()

// Admin product operations - Admin rate limiting (200 per 15 min)
productRouter.post("/create", auth, admin, rateLimitAdmin, createProductController)
productRouter.put('/update-product-details', auth, admin, rateLimitAdmin, updateProductDetails)
productRouter.delete('/delete-product', auth, admin, rateLimitAdmin, deleteProductDetails)

// Public product browsing - ECOMMERCE OPTIMIZED (1000 per 15 min = ~67 per minute)
// Quick commerce users browse many products rapidly - very generous limits
productRouter.post('/get', rateLimitProductBrowsing, getProductController)
productRouter.post("/get-product-by-category", rateLimitProductBrowsing, getProductByCategory)
productRouter.post('/get-pruduct-by-category-and-subcategory', rateLimitProductBrowsing, getProductByCategoryAndSubCategory)
productRouter.post('/get-product-details', rateLimitProductBrowsing, getProductDetails)

// Enhanced search with advanced filters and sorting
productRouter.post('/search-with-filters', rateLimitProductBrowsing, getProductsWithFilters)

// Get filter metadata
productRouter.get('/brands', rateLimitProductBrowsing, getAllBrands)
productRouter.get('/price-range', rateLimitProductBrowsing, getPriceRange)

// Search product - ECOMMERCE OPTIMIZED (100 per minute)
// Users search frequently and type fast in quick commerce
productRouter.post('/search-product', rateLimitSearch, searchProduct)

export default productRouter