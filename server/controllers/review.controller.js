import ReviewModel from "../models/review.model.js";
import ProductModel from "../models/product.model.js";
import OrderModel from "../models/order.model.js";
import uploadImageClodinary from "../utils/uploadImageClodinary.js";

/**
 * Validate and sanitize image URL
 * Filters out malformed URLs that could cause "URI malformed" errors
 */
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url === 'null' || url === 'undefined' || url === '' || url.trim() === '') return false;
    
    // Check for control characters (0x00-0x1F, 0x7F)
    if (/[\x00-\x1F\x7F]/.test(url)) return false;
    
    // Must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    
    try {
        // Try to decode the URL to check if it's properly encoded
        const decoded = decodeURI(url);
        // Validate URL structure
        const urlObj = new URL(decoded);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        // If decoding fails, try with original URL
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
}

/**
 * Clean and validate image array
 * Removes all malformed URLs
 */
function cleanImageArray(images) {
    if (!images || !Array.isArray(images)) return [];
    return images.filter(isValidImageUrl);
}

/**
 * Create a new review (verified purchase only)
 * POST /api/review/create
 */
export async function createReviewController(request, response) {
    try {
        const userId = request.userId; // From auth middleware
        const { productId, orderId, rating, title, review, images } = request.body;

        // Validate required fields
        if (!productId) {
            return response.status(400).json({
                message: "Product is required",
                error: true,
                success: false
            });
        }

        if (!orderId) {
            return response.status(400).json({
                message: "Order ID is required (verified purchase only)",
                error: true,
                success: false
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return response.status(400).json({
                message: "Rating must be between 1 and 5",
                error: true,
                success: false
            });
        }

        if (!title || title.trim().length === 0) {
            return response.status(400).json({
                message: "Review title is required",
                error: true,
                success: false
            });
        }

        if (!review || review.trim().length < 10) {
            return response.status(400).json({
                message: "Review must be at least 10 characters long",
                error: true,
                success: false
            });
        }

        // Verify order exists and belongs to user
        const order = await OrderModel.findOne({
            _id: orderId,
            userId: userId,
            productId: productId,
            order_status: 'DELIVERED' // Only allow reviews for delivered orders
        });

        if (!order) {
            return response.status(400).json({
                message: "Invalid order or order not delivered yet",
                error: true,
                success: false
            });
        }

        // Check if user already reviewed this product for this order
        const existingReview = await ReviewModel.findOne({
            userId: userId,
            productId: productId,
            orderId: orderId
        });

        if (existingReview) {
            return response.status(400).json({
                message: "You have already reviewed this product",
                error: true,
                success: false
            });
        }

        // Images are already uploaded from frontend, validate and clean them
        const reviewImages = cleanImageArray(images);
        
        // Log if any images were filtered out
        if (images && images.length > 0 && reviewImages.length !== images.length) {
            console.warn(`Filtered out ${images.length - reviewImages.length} malformed image URLs`);
        }

        // Create review
        const newReview = new ReviewModel({
            userId,
            productId,
            orderId,
            rating,
            title: title.trim(),
            review: review.trim(),
            images: reviewImages,
            verified_purchase: true,
            status: 'APPROVED' // Auto-approve (can be changed to PENDING for manual moderation)
        });
        
        const savedReview = await newReview.save();

        // Update product review statistics
        await updateProductReviewStats(productId);

        return response.status(201).json({
            message: "Review submitted successfully",
            data: savedReview,
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Create review error:", error.message);
        return response.status(500).json({
            message: error.message || "Failed to submit review",
            error: true,
            success: false
        });
    }
}

/**
 * Get reviews for a product (paginated, filtered, sorted)
 * GET /api/review/product/:productId
 * Query params: page, limit, rating, sort, verified
 */
export async function getProductReviewsController(request, response) {
    try {
        const { productId } = request.params;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const rating = request.query.rating ? parseInt(request.query.rating) : null;
        const sort = request.query.sort || 'recent'; // recent, helpful, rating_high, rating_low
        const verifiedOnly = request.query.verified === 'true';

        // Build query
        const query = {
            productId: productId,
            status: 'APPROVED'
        };

        if (rating) {
            query.rating = rating;
        }

        if (verifiedOnly) {
            query.verified_purchase = true;
        }

        // Build sort
        let sortQuery = {};
        switch (sort) {
            case 'helpful':
                sortQuery = { helpful_count: -1, createdAt: -1 };
                break;
            case 'rating_high':
                sortQuery = { rating: -1, createdAt: -1 };
                break;
            case 'rating_low':
                sortQuery = { rating: 1, createdAt: -1 };
                break;
            case 'recent':
            default:
                sortQuery = { createdAt: -1 };
        }

        // Get reviews
        const reviews = await ReviewModel.find(query)
            .sort(sortQuery)
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('userId', 'name avatar')
            .lean();

        // Clean up reviews - filter out malformed/invalid images using comprehensive validation
        const cleanedReviews = reviews.map(review => ({
            ...review,
            images: cleanImageArray(review.images)
        }));

        // Get total count
        const totalReviews = await ReviewModel.countDocuments(query);

        // Get product review stats
        const product = await ProductModel.findById(productId).select('review_stats').lean();

        return response.status(200).json({
            message: "Reviews retrieved successfully",
            data: {
                reviews: cleanedReviews,
                pagination: {
                    page,
                    limit,
                    total: totalReviews,
                    totalPages: Math.ceil(totalReviews / limit)
                },
                stats: product?.review_stats || {}
            },
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Get product reviews error:", error);
        return response.status(500).json({
            message: error.message || "Failed to get reviews",
            error: true,
            success: false
        });
    }
}

/**
 * Mark review as helpful
 * PUT /api/review/helpful/:reviewId
 */
export async function markReviewHelpfulController(request, response) {
    try {
        const userId = request.userId; // From auth middleware
        const { reviewId } = request.params;

        const review = await ReviewModel.findById(reviewId);

        if (!review) {
            return response.status(404).json({
                message: "Review not found",
                error: true,
                success: false
            });
        }

        // Check if user already marked as helpful
        const alreadyMarked = review.helpful_by.includes(userId);

        if (alreadyMarked) {
            // Remove from helpful
            review.helpful_by = review.helpful_by.filter(id => id.toString() !== userId.toString());
            review.helpful_count = Math.max(0, review.helpful_count - 1);
        } else {
            // Add to helpful
            review.helpful_by.push(userId);
            review.helpful_count += 1;
        }

        await review.save();

        return response.status(200).json({
            message: alreadyMarked ? "Removed from helpful" : "Marked as helpful",
            data: {
                helpful_count: review.helpful_count,
                marked_helpful: !alreadyMarked
            },
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Mark review helpful error:", error);
        return response.status(500).json({
            message: error.message || "Failed to update review",
            error: true,
            success: false
        });
    }
}

/**
 * Get user's reviews
 * GET /api/review/user
 */
export async function getUserReviewsController(request, response) {
    try {
        const userId = request.userId; // From auth middleware
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;

        const reviews = await ReviewModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('productId', 'name image')
            .lean();

        // Clean review images
        const cleanedReviews = reviews.map(review => ({
            ...review,
            images: cleanImageArray(review.images)
        }));

        const totalReviews = await ReviewModel.countDocuments({ userId });

        return response.status(200).json({
            message: "User reviews retrieved successfully",
            data: {
                reviews: cleanedReviews,
                pagination: {
                    page,
                    limit,
                    total: totalReviews,
                    totalPages: Math.ceil(totalReviews / limit)
                }
            },
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Get user reviews error:", error);
        return response.status(500).json({
            message: error.message || "Failed to get reviews",
            error: true,
            success: false
        });
    }
}

/**
 * Update review (user can edit their own review)
 * PUT /api/review/update/:reviewId
 */
export async function updateReviewController(request, response) {
    try {
        const userId = request.userId;
        const { reviewId } = request.params;
        const { rating, title, review, images } = request.body;

        const existingReview = await ReviewModel.findOne({
            _id: reviewId,
            userId: userId
        });

        if (!existingReview) {
            return response.status(404).json({
                message: "Review not found or unauthorized",
                error: true,
                success: false
            });
        }

        // Validate inputs
        if (rating && (rating < 1 || rating > 5)) {
            return response.status(400).json({
                message: "Rating must be between 1 and 5",
                error: true,
                success: false
            });
        }

        if (title && title.trim().length === 0) {
            return response.status(400).json({
                message: "Review title cannot be empty",
                error: true,
                success: false
            });
        }

        if (review && review.trim().length < 10) {
            return response.status(400).json({
                message: "Review must be at least 10 characters long",
                error: true,
                success: false
            });
        }

        // Update fields
        if (rating) existingReview.rating = rating;
        if (title) existingReview.title = title.trim();
        if (review) existingReview.review = review.trim();

        // Validate and clean new images if provided
        if (images && images.length > 0) {
            // Clean and validate the provided images
            const validImages = cleanImageArray(images);
            
            // Log if any images were filtered out
            if (validImages.length !== images.length) {
                console.warn(`Filtered out ${images.length - validImages.length} malformed image URLs`);
            }
            
            existingReview.images = validImages;
        }

        await existingReview.save();

        // Update product review statistics if rating changed
        if (rating) {
            await updateProductReviewStats(existingReview.productId);
        }

        return response.status(200).json({
            message: "Review updated successfully",
            data: existingReview,
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Update review error:", error);
        return response.status(500).json({
            message: error.message || "Failed to update review",
            error: true,
            success: false
        });
    }
}

/**
 * Delete review (user can delete their own review)
 * DELETE /api/review/delete/:reviewId
 */
export async function deleteReviewController(request, response) {
    try {
        const userId = request.userId;
        const { reviewId } = request.params;

        const review = await ReviewModel.findOne({
            _id: reviewId,
            userId: userId
        });

        if (!review) {
            return response.status(404).json({
                message: "Review not found or unauthorized",
                error: true,
                success: false
            });
        }

        const productId = review.productId;

        await ReviewModel.deleteOne({ _id: reviewId });

        // Update product review statistics
        await updateProductReviewStats(productId);

        return response.status(200).json({
            message: "Review deleted successfully",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Delete review error:", error);
        return response.status(500).json({
            message: error.message || "Failed to delete review",
            error: true,
            success: false
        });
    }
}

/**
 * Admin: Respond to review
 * PUT /api/review/admin/respond/:reviewId
 */
export async function adminRespondToReviewController(request, response) {
    try {
        const adminId = request.userId;
        const { reviewId } = request.params;
        const { response: adminResponseText } = request.body;

        if (!adminResponseText || adminResponseText.trim().length === 0) {
            return response.status(400).json({
                message: "Response text is required",
                error: true,
                success: false
            });
        }

        const review = await ReviewModel.findById(reviewId);

        if (!review) {
            return response.status(404).json({
                message: "Review not found",
                error: true,
                success: false
            });
        }

        review.admin_response = {
            text: adminResponseText.trim(),
            responded_at: new Date(),
            responded_by: adminId
        };

        await review.save();

        // Clean images before returning
        const cleanedReview = review.toObject();
        cleanedReview.images = cleanImageArray(cleanedReview.images);

        return response.status(200).json({
            message: "Response added successfully",
            data: cleanedReview,
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Admin respond to review error:", error);
        return response.status(500).json({
            message: error.message || "Failed to add response",
            error: true,
            success: false
        });
    }
}

/**
 * Admin: Update review status (approve/reject)
 * PUT /api/review/admin/status/:reviewId
 */
export async function adminUpdateReviewStatusController(request, response) {
    try {
        const { reviewId } = request.params;
        const { status, rejection_reason } = request.body;

        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return response.status(400).json({
                message: "Invalid status",
                error: true,
                success: false
            });
        }

        const review = await ReviewModel.findById(reviewId);

        if (!review) {
            return response.status(404).json({
                message: "Review not found",
                error: true,
                success: false
            });
        }

        const oldStatus = review.status;
        review.status = status;

        if (status === 'REJECTED' && rejection_reason) {
            review.rejection_reason = rejection_reason;
        }

        await review.save();

        // Update product statistics if status changed
        if (oldStatus !== status) {
            await updateProductReviewStats(review.productId);
        }

        return response.status(200).json({
            message: `Review ${status.toLowerCase()} successfully`,
            data: review,
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Admin update review status error:", error);
        return response.status(500).json({
            message: error.message || "Failed to update review status",
            error: true,
            success: false
        });
    }
}

/**
 * Admin: Get all reviews (with filters)
 * GET /api/review/admin/all
 */
export async function adminGetAllReviewsController(request, response) {
    try {
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        const status = request.query.status; // PENDING, APPROVED, REJECTED
        const rating = request.query.rating ? parseInt(request.query.rating) : null;

        const query = {};
        if (status) query.status = status;
        if (rating) query.rating = rating;

        const reviews = await ReviewModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('userId', 'name email avatar')
            .populate('productId', 'name image')
            .lean();

        // Clean review images
        const cleanedReviews = reviews.map(review => ({
            ...review,
            images: cleanImageArray(review.images)
        }));

        const totalReviews = await ReviewModel.countDocuments(query);

        return response.status(200).json({
            message: "Reviews retrieved successfully",
            data: {
                reviews: cleanedReviews,
                pagination: {
                    page,
                    limit,
                    total: totalReviews,
                    totalPages: Math.ceil(totalReviews / limit)
                }
            },
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Admin get all reviews error:", error);
        return response.status(500).json({
            message: error.message || "Failed to get reviews",
            error: true,
            success: false
        });
    }
}

/**
 * Helper function to update product review statistics
 */
async function updateProductReviewStats(productId) {
    try {
        // Get all approved reviews for this product
        const reviews = await ReviewModel.find({
            productId: productId,
            status: 'APPROVED'
        }).select('rating').lean();

        const totalReviews = reviews.length;

        if (totalReviews === 0) {
            // No reviews, reset stats
            await ProductModel.findByIdAndUpdate(productId, {
                'review_stats.total_reviews': 0,
                'review_stats.average_rating': 0,
                'review_stats.rating_distribution.five_star': 0,
                'review_stats.rating_distribution.four_star': 0,
                'review_stats.rating_distribution.three_star': 0,
                'review_stats.rating_distribution.two_star': 0,
                'review_stats.rating_distribution.one_star': 0
            });
            return;
        }

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = parseFloat((totalRating / totalReviews).toFixed(1));

        // Calculate rating distribution
        const distribution = {
            five_star: reviews.filter(r => r.rating === 5).length,
            four_star: reviews.filter(r => r.rating === 4).length,
            three_star: reviews.filter(r => r.rating === 3).length,
            two_star: reviews.filter(r => r.rating === 2).length,
            one_star: reviews.filter(r => r.rating === 1).length
        };

        // Update product
        await ProductModel.findByIdAndUpdate(productId, {
            'review_stats.total_reviews': totalReviews,
            'review_stats.average_rating': averageRating,
            'review_stats.rating_distribution': distribution
        });

    } catch (error) {
        console.error("Update product review stats error:", error);
        // Don't throw error, just log it
    }
}

/**
 * Check if user can review a product
 * GET /api/review/can-review/:productId
 */
export async function checkCanReviewController(request, response) {
    try {
        const userId = request.userId;
        const { productId } = request.params;

        // Find delivered orders for this product
        const deliveredOrders = await OrderModel.find({
            userId: userId,
            productId: productId,
            order_status: 'DELIVERED'
        }).select('_id orderId').lean();

        if (deliveredOrders.length === 0) {
            return response.status(200).json({
                message: "User has not purchased this product",
                data: {
                    can_review: false,
                    reason: "Not purchased"
                },
                error: false,
                success: true
            });
        }

        // Check which orders don't have reviews yet
        const orderIds = deliveredOrders.map(o => o._id);
        const existingReviews = await ReviewModel.find({
            userId: userId,
            productId: productId,
            orderId: { $in: orderIds }
        }).select('orderId').lean();

        const reviewedOrderIds = existingReviews.map(r => r.orderId.toString());
        const unreviewedOrders = deliveredOrders.filter(
            order => !reviewedOrderIds.includes(order._id.toString())
        );

        if (unreviewedOrders.length === 0) {
            return response.status(200).json({
                message: "User has already reviewed all purchases",
                data: {
                    can_review: false,
                    reason: "Already reviewed"
                },
                error: false,
                success: true
            });
        }

        return response.status(200).json({
            message: "User can review this product",
            data: {
                can_review: true,
                orders: unreviewedOrders
            },
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Check can review error:", error);
        return response.status(500).json({
            message: error.message || "Failed to check review eligibility",
            error: true,
            success: false
        });
    }
}

