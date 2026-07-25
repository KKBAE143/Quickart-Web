import { Router } from 'express';
import auth from '../middleware/auth.js';
import { admin } from '../middleware/Admin.js';
import {
    createReviewController,
    getProductReviewsController,
    markReviewHelpfulController,
    getUserReviewsController,
    updateReviewController,
    deleteReviewController,
    adminRespondToReviewController,
    adminUpdateReviewStatusController,
    adminGetAllReviewsController,
    checkCanReviewController
} from '../controllers/review.controller.js';
import { rateLimitApi } from '../middleware/rateLimiter.js';

const reviewRouter = Router();

// Public routes (no authentication required)
reviewRouter.get('/product/:productId', rateLimitApi, getProductReviewsController); // Get product reviews

// Authenticated user routes
reviewRouter.post('/create', auth, rateLimitApi, createReviewController); // Create review
reviewRouter.put('/helpful/:reviewId', auth, rateLimitApi, markReviewHelpfulController); // Mark helpful
reviewRouter.get('/user', auth, rateLimitApi, getUserReviewsController); // Get user's reviews
reviewRouter.put('/update/:reviewId', auth, rateLimitApi, updateReviewController); // Update review
reviewRouter.delete('/delete/:reviewId', auth, rateLimitApi, deleteReviewController); // Delete review
reviewRouter.get('/can-review/:productId', auth, rateLimitApi, checkCanReviewController); // Check if can review

// Admin routes
reviewRouter.put('/admin/respond/:reviewId', auth, admin, rateLimitApi, adminRespondToReviewController); // Admin respond
reviewRouter.put('/admin/status/:reviewId', auth, admin, rateLimitApi, adminUpdateReviewStatusController); // Update status
reviewRouter.get('/admin/all', auth, admin, rateLimitApi, adminGetAllReviewsController); // Get all reviews

export default reviewRouter;

