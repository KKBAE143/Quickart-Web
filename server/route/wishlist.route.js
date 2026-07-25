import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
    addToWishlistController,
    removeFromWishlistController,
    getWishlistController,
    moveToCartController,
    checkWishlistController,
    getWishlistCountController,
    clearWishlistController
} from '../controllers/wishlist.controller.js';

const wishlistRouter = Router();

// All wishlist routes require authentication
wishlistRouter.use(auth);

// Add to wishlist
wishlistRouter.post('/add', addToWishlistController);

// Remove from wishlist
wishlistRouter.delete('/remove/:productId', removeFromWishlistController);

// Get user's wishlist
wishlistRouter.get('/', getWishlistController);

// Move to cart
wishlistRouter.post('/move-to-cart/:productId', moveToCartController);

// Check if product is in wishlist
wishlistRouter.get('/check/:productId', checkWishlistController);

// Get wishlist count
wishlistRouter.get('/count', getWishlistCountController);

// Clear entire wishlist
wishlistRouter.delete('/clear', clearWishlistController);

export default wishlistRouter;

