import ProductModel from "../models/product.model.js";
import OrderModel from "../models/order.model.js";

/**
 * Get Similar Products
 * Algorithm: Find products in same category/subcategory, excluding current product
 * Use case: "Similar Products" section on product page
 */
export async function getSimilarProductsController(request, response) {
    try {
        const { productId } = request.params;
        const limit = parseInt(request.query.limit) || 10;

        // Get current product to find its categories
        const currentProduct = await ProductModel.findById(productId);
        
        if (!currentProduct) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        // Find similar products based on category and subcategory
        const similarProducts = await ProductModel.find({
            _id: { $ne: productId }, // Exclude current product
            publish: true,
            stock: { $gt: 0 },
            $or: [
                { category: { $in: currentProduct.category } },
                { subCategory: { $in: currentProduct.subCategory } }
            ]
        })
        .populate('category subCategory')
        .sort({ view_count: -1, purchase_count: -1 }) // Prioritize popular products
        .limit(limit);

        return response.json({
            message: "Similar products retrieved successfully",
            data: similarProducts,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Get Frequently Bought Together
 * Algorithm: Analyze order history to find products often purchased with current product
 * Use case: "Frequently Bought Together" section on product page
 */
export async function getFrequentlyBoughtTogetherController(request, response) {
    try {
        const { productId } = request.params;
        const limit = parseInt(request.query.limit) || 5;

        // Find all orders containing this product
        const ordersWithProduct = await OrderModel.find({
            productId: productId,
            order_status: 'DELIVERED' // Only consider completed orders
        }).select('userId orderId');

        if (ordersWithProduct.length === 0) {
            // No order history, return similar products as fallback
            return getSimilarProductsController(request, response);
        }

        // Get unique order IDs
        const orderIds = [...new Set(ordersWithProduct.map(order => order.orderId))];

        // Find other products in the same orders
        const productsInSameOrders = await OrderModel.find({
            orderId: { $in: orderIds },
            productId: { $ne: productId } // Exclude current product
        });

        // Count frequency of each product
        const productFrequency = {};
        productsInSameOrders.forEach(order => {
            const prodId = order.productId.toString();
            productFrequency[prodId] = (productFrequency[prodId] || 0) + 1;
        });

        // Sort by frequency and get top products
        const topProductIds = Object.entries(productFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([prodId]) => prodId);

        // Get full product details
        const recommendedProducts = await ProductModel.find({
            _id: { $in: topProductIds },
            publish: true,
            stock: { $gt: 0 }
        })
        .populate('category subCategory');

        return response.json({
            message: "Frequently bought together products retrieved successfully",
            data: recommendedProducts,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Get Trending Products
 * Algorithm: Sort by view_count and purchase_count
 * Use case: "Trending Now" section on homepage
 */
export async function getTrendingProductsController(request, response) {
    try {
        const limit = parseInt(request.query.limit) || 20;
        const categoryId = request.query.categoryId; // Optional category filter

        const query = {
            publish: true,
            stock: { $gt: 0 },
            $or: [
                { view_count: { $gt: 0 } },
                { purchase_count: { $gt: 0 } }
            ]
        };

        // Add category filter if provided
        if (categoryId) {
            query.category = categoryId;
        }

        const trendingProducts = await ProductModel.find(query)
            .populate('category subCategory')
            .sort({ 
                purchase_count: -1,  // Purchase weight higher
                view_count: -1,
                createdAt: -1        // Recent products get boost
            })
            .limit(limit);

        return response.json({
            message: "Trending products retrieved successfully",
            data: trendingProducts,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Get Recommended For You (Personalized)
 * Algorithm: Based on user's order history - find products in categories they've purchased from
 * Use case: "Recommended For You" section on homepage
 */
export async function getRecommendedForYouController(request, response) {
    try {
        const userId = request.userId; // From auth middleware
        const limit = parseInt(request.query.limit) || 15;

        if (!userId) {
            // User not logged in, return trending products as fallback
            return getTrendingProductsController(request, response);
        }

        // Find user's order history
        const userOrders = await OrderModel.find({
            userId: userId,
            order_status: 'DELIVERED'
        })
        .populate('productId')
        .limit(50); // Check last 50 orders

        if (userOrders.length === 0) {
            // No order history, return trending products
            return getTrendingProductsController(request, response);
        }

        // Extract categories and subcategories from user's purchases
        const userCategories = [];
        const userSubCategories = [];
        const purchasedProductIds = [];

        userOrders.forEach(order => {
            if (order.productId) {
                purchasedProductIds.push(order.productId._id);
                if (order.productId.category) {
                    userCategories.push(...order.productId.category);
                }
                if (order.productId.subCategory) {
                    userSubCategories.push(...order.productId.subCategory);
                }
            }
        });

        // Remove duplicates
        const uniqueCategories = [...new Set(userCategories.map(c => c.toString()))];
        const uniqueSubCategories = [...new Set(userSubCategories.map(c => c.toString()))];

        // Find products in user's preferred categories (excluding already purchased)
        const recommendedProducts = await ProductModel.find({
            _id: { $nin: purchasedProductIds }, // Don't recommend already purchased
            publish: true,
            stock: { $gt: 0 },
            $or: [
                { category: { $in: uniqueCategories } },
                { subCategory: { $in: uniqueSubCategories } }
            ]
        })
        .populate('category subCategory')
        .sort({ 
            purchase_count: -1,
            view_count: -1,
            'review_stats.average_rating': -1 // Boost highly rated products
        })
        .limit(limit);

        return response.json({
            message: "Personalized recommendations retrieved successfully",
            data: recommendedProducts,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Get Category-Based Recommendations
 * Algorithm: Find popular products in a specific category
 * Use case: "You May Also Like" on category pages
 */
export async function getCategoryBasedRecommendationsController(request, response) {
    try {
        const { categoryId } = request.params;
        const limit = parseInt(request.query.limit) || 12;

        const categoryProducts = await ProductModel.find({
            category: categoryId,
            publish: true,
            stock: { $gt: 0 }
        })
        .populate('category subCategory')
        .sort({ 
            purchase_count: -1,
            view_count: -1,
            'review_stats.average_rating': -1
        })
        .limit(limit);

        return response.json({
            message: "Category recommendations retrieved successfully",
            data: categoryProducts,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Track Product View
 * Increment view_count when a product is viewed
 */
export async function trackProductViewController(request, response) {
    try {
        const { productId } = request.params;

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $inc: { view_count: 1 } }, // Increment by 1
            { new: true }
        );

        if (!updatedProduct) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Product view tracked",
            data: updatedProduct,
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

/**
 * Helper function to increment purchase_count
 * Called from order controller when order is delivered
 */
export async function incrementPurchaseCount(productId) {
    try {
        await ProductModel.findByIdAndUpdate(
            productId,
            { $inc: { purchase_count: 1 } }
        );
    } catch (error) {
        console.error('Error incrementing purchase count:', error);
    }
}

