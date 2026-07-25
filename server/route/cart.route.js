import { Router } from "express";
import auth from "../middleware/auth.js";
import { addToCartItemController, deleteCartItemQtyController, getCartItemController, updateCartItemQtyController } from "../controllers/cart.controller.js";
import { rateLimitCart } from "../middleware/rateLimiter.js";

const cartRouter = Router()

// Cart operations - ECOMMERCE OPTIMIZED (200 per 15 min = ~13 per minute)
// Users add/remove items frequently while shopping
cartRouter.post('/create', auth, rateLimitCart, addToCartItemController)
cartRouter.get("/get", auth, rateLimitCart, getCartItemController)
cartRouter.put('/update-qty', auth, rateLimitCart, updateCartItemQtyController)
cartRouter.delete('/delete-cart-item', auth, rateLimitCart, deleteCartItemQtyController)

export default cartRouter