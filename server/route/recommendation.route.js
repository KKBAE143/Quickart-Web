import { Router } from 'express';
import { 
    getSimilarProductsController, 
    getFrequentlyBoughtTogetherController,
    getTrendingProductsController,
    getRecommendedForYouController,
    getCategoryBasedRecommendationsController,
    trackProductViewController
} from '../controllers/recommendation.controller.js';
import auth from '../middleware/auth.js';

const recommendationRouter = Router();

// Public routes (no auth required)
recommendationRouter.get('/similar/:productId', getSimilarProductsController);
recommendationRouter.get('/frequently-bought-together/:productId', getFrequentlyBoughtTogetherController);
recommendationRouter.get('/trending', getTrendingProductsController);
recommendationRouter.get('/category/:categoryId', getCategoryBasedRecommendationsController);
recommendationRouter.post('/track-view/:productId', trackProductViewController);

// Authenticated routes (personalized recommendations)
recommendationRouter.get('/for-you', auth, getRecommendedForYouController);

export default recommendationRouter;

