import WishlistModel from "../models/wishlist.model.js";
import ProductModel from "../models/product.model.js";
import CartProductModel from "../models/cartproduct.model.js";

/**
 * Add product to wishlist
 */
export async function addToWishlistController(request, response) {
    try {
        const userId = request.userId; // from auth middleware
        const { productId } = request.body;

        if (!productId) {
            return response.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        // Check if product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        // Check if already in wishlist
        const existingItem = await WishlistModel.findOne({
            userId,
            productId
        });

        if (existingItem) {
            return response.status(200).json({
                message: "Product already in wishlist",
                error: false,
                success: true,
                data: existingItem
            });
        }

        // Add to wishlist
        const wishlistItem = new WishlistModel({
            userId,
            productId
        });

        const savedItem = await wishlistItem.save();

        return response.status(201).json({
            message: "Product added to wishlist",
            error: false,
            success: true,
            data: savedItem
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Failed to add to wishlist",
            error: true,
            success: false
        });
    }
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlistController(request, response) {
    try {
        const userId = request.userId;
        const { productId } = request.params;

        if (!productId) {
            return response.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        const deletedItem = await WishlistModel.findOneAndDelete({
            userId,
            productId
        });

        if (!deletedItem) {
            return response.status(404).json({
                message: "Product not found in wishlist",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            message: "Product removed from wishlist",
            error: false,
            success: true,
            data: deletedItem
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Failed to remove from wishlist",
            error: true,
            success: false
        });
    }
}

/**
 * Get user's wishlist with populated product details
 */
export async function getWishlistController(request, response) {
    try {
        const userId = request.userId;

        const wishlistItems = await WishlistModel.find({ userId })
            .populate({
                path: 'productId',
                select: 'name image price discount stock category subCategory'
            })
            .sort({ addedAt: -1 }); // Most recent first

        return response.status(200).json({
            message: "Wishlist fetched successfully",
            error: false,
            success: true,
            data: wishlistItems
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Failed to fetch wishlist",
            error: true,
            success: false
        });
    }
}

/**
 * Move product from wishlist to cart
 */
export async function moveToCartController(request, response) {
    try {
        const userId = request.userId;
        const { productId } = request.params;

        if (!productId) {
            return response.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        // Check if product exists in wishlist
        const wishlistItem = await WishlistModel.findOne({
            userId,
            productId
        });

        if (!wishlistItem) {
            return response.status(404).json({
                message: "Product not found in wishlist",
                error: true,
                success: false
            });
        }

        // Check if product exists and is in stock
        const product = await ProductModel.findById(productId);
        if (!product) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        if (product.stock < 1) {
            return response.status(400).json({
                message: "Product is out of stock",
                error: true,
                success: false
            });
        }

        // Check if already in cart
        const existingCartItem = await CartProductModel.findOne({
            userId,
            productId
        });

        if (existingCartItem) {
            // Update quantity if already in cart
            existingCartItem.quantity += 1;
            await existingCartItem.save();
        } else {
            // Add to cart
            const cartItem = new CartProductModel({
                userId,
                productId,
                quantity: 1
            });
            await cartItem.save();
        }

        // Remove from wishlist
        await WishlistModel.findOneAndDelete({
            userId,
            productId
        });

        return response.status(200).json({
            message: "Product moved to cart successfully",
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Failed to move to cart",
            error: true,
            success: false
        });
    }
}

/**
 * Check if product is in user's wishlist
 */
export async function checkWishlistController(request, response) {
    try {
        const userId = request.userId;
        const { productId } = request.params;

        if (!productId) {
            return response.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        const wishlistItem = await WishlistModel.findOne({
            userId,
            productId
        });

        return response.status(200).json({
            message: "Check completed",
            error: false,
            success: true,
            data: {
                inWishlist: !!wishlistItem
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Failed to check wishlist",
            error: true,
            success: false
        });
    }
}

/**
 * Get wishlist count
 */
export async function getWishlistCountController(request, response) {
    try {
        const userId = request.userId;

        const count = await WishlistModel.countDocuments({ userId });

        return response.status(200).json({
            message: "Wishlist count fetched successfully",
            error: false,
            success: true,
            data: {
                count
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Failed to get wishlist count",
            error: true,
            success: false
        });
    }
}

/**
 * Clear entire wishlist
 */
export async function clearWishlistController(request, response) {
    try {
        const userId = request.userId;

        const result = await WishlistModel.deleteMany({ userId });

        return response.status(200).json({
            message: `Wishlist cleared successfully. ${result.deletedCount} items removed.`,
            error: false,
            success: true,
            data: {
                deletedCount: result.deletedCount
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || "Failed to clear wishlist",
            error: true,
            success: false
        });
    }
}

