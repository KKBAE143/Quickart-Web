import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
    // Rider Dashboard & Profile
    getRiderDashboardController,
    toggleRiderOnlineStatusController,

    // Location Tracking
    updateRiderLocationController,
    getRiderLocationHistoryController,

    // Order Management
    getAvailableOrdersController,
    acceptOrderController,
    declineOrderController,
    arrivedAtStoreController,
    orderPickedUpController,
    reachedCustomerController,
    verifyDeliveryOtpController,
    resendDeliveryOtpController,
    markDeliveryFailedController,
    getActiveOrderController,
    getRiderOrderHistoryController,

    // Wallet & Earnings
    getWalletDetailsController,
    getEarningsSummaryController,

    // Admin Functions
    getAllOnlineRidersController,
    getAllAgentsController,
    updateAgentStatusController,
    getRiderDetailsAdminController,

    // Store Management
    upsertStoreLocationController,
    getStoresController
} from '../controllers/delivery.controller.js';

// Order Assignment Controllers
import {
    getPendingOrdersController,
    getAvailableRidersController,
    directAssignOrderController,
    broadcastOrderController,
    escalateBroadcastController,
    cancelAssignmentController,
    getAssignmentStatusController
} from '../controllers/orderAssignment.controller.js';

const deliveryRouter = Router();

// ============================================================================
// RIDER DASHBOARD & PROFILE ROUTES
// ============================================================================

/**
 * GET /api/delivery/dashboard
 * Get rider's dashboard data including stats, active order, wallet
 */
deliveryRouter.get('/dashboard', auth, getRiderDashboardController);

/**
 * POST /api/delivery/toggle-status
 * Toggle online/offline status
 * Body: { isOnline: boolean, lat?: number, lng?: number }
 */
deliveryRouter.post('/toggle-status', auth, toggleRiderOnlineStatusController);

// ============================================================================
// LOCATION TRACKING ROUTES
// ============================================================================

/**
 * POST /api/delivery/location
 * Update rider's current location (called frequently from mobile app)
 * Body: { lat, lng, accuracy?, speed?, heading?, altitude?, batteryLevel?, activityType? }
 */
deliveryRouter.post('/location', auth, updateRiderLocationController);

/**
 * GET /api/delivery/location-history/:orderId
 * Get location history for a specific order
 */
deliveryRouter.get('/location-history/:orderId', auth, getRiderLocationHistoryController);

// ============================================================================
// ORDER MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/delivery/available-orders
 * Get orders available for acceptance
 */
deliveryRouter.get('/available-orders', auth, getAvailableOrdersController);

/**
 * GET /api/delivery/active-order
 * Get current active order details
 */
deliveryRouter.get('/active-order', auth, getActiveOrderController);

/**
 * POST /api/delivery/accept/:orderId
 * Accept an order
 */
deliveryRouter.post('/accept/:orderId', auth, acceptOrderController);

/**
 * POST /api/delivery/decline/:orderId
 * Decline an order
 * Body: { reason?: string }
 */
deliveryRouter.post('/decline/:orderId', auth, declineOrderController);

/**
 * POST /api/delivery/arrived-store/:orderId
 * Mark arrived at store - triggers "Order being collected" notification
 */
deliveryRouter.post('/arrived-store/:orderId', auth, arrivedAtStoreController);

/**
 * POST /api/delivery/picked-up/:orderId
 * Mark order picked up from store - shows customer location
 */
deliveryRouter.post('/picked-up/:orderId', auth, orderPickedUpController);

/**
 * POST /api/delivery/reached/:orderId
 * Mark reached customer location - generates and sends OTP
 */
deliveryRouter.post('/reached/:orderId', auth, reachedCustomerController);

/**
 * POST /api/delivery/verify-otp/:orderId
 * Verify delivery OTP and complete order
 * Body: { otp: string, codCollected?: boolean }
 */
deliveryRouter.post('/verify-otp/:orderId', auth, verifyDeliveryOtpController);

/**
 * POST /api/delivery/resend-otp/:orderId
 * Resend delivery OTP to customer
 */
deliveryRouter.post('/resend-otp/:orderId', auth, resendDeliveryOtpController);

/**
 * POST /api/delivery/failed/:orderId
 * Mark delivery as failed
 * Body: { reason: string, notes?: string }
 */
deliveryRouter.post('/failed/:orderId', auth, markDeliveryFailedController);

/**
 * GET /api/delivery/order-history
 * Get rider's order history
 * Query: { page?, limit?, status? }
 */
deliveryRouter.get('/order-history', auth, getRiderOrderHistoryController);

// ============================================================================
// WALLET & EARNINGS ROUTES
// ============================================================================

/**
 * GET /api/delivery/wallet
 * Get wallet details and transaction history
 * Query: { page?, limit? }
 */
deliveryRouter.get('/wallet', auth, getWalletDetailsController);

/**
 * GET /api/delivery/earnings
 * Get earnings summary
 * Query: { period?: 'today' | 'week' | 'month' }
 */
deliveryRouter.get('/earnings', auth, getEarningsSummaryController);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * GET /api/delivery/admin/online-riders
 * Get all online riders (Admin only)
 */
deliveryRouter.get('/admin/online-riders', auth, getAllOnlineRidersController);

/**
 * GET /api/delivery/admin/all-agents
 * Get all delivery agents regardless of status (Admin only)
 * Query: { status?, search? }
 */
deliveryRouter.get('/admin/all-agents', auth, getAllAgentsController);

/**
 * PUT /api/delivery/admin/agent/:agentId/status
 * Update agent status (approve, suspend, reactivate) (Admin only)
 * Body: { status: 'Active' | 'Inactive' | 'Suspended', reason?: string }
 */
deliveryRouter.put('/admin/agent/:agentId/status', auth, updateAgentStatusController);

/**
 * GET /api/delivery/admin/rider/:riderId
 * Get specific rider details (Admin only)
 */
deliveryRouter.get('/admin/rider/:riderId', auth, getRiderDetailsAdminController);

// ============================================================================
// STORE MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/delivery/stores
 * Get all store locations
 */
deliveryRouter.get('/stores', auth, getStoresController);

/**
 * POST /api/delivery/stores
 * Create or update store location (Admin only)
 * Body: { storeCode, name, address, latitude, longitude, phone?, managerName?, operatingHours?, deliveryRadius?, googlePlaceId? }
 */
deliveryRouter.post('/stores', auth, upsertStoreLocationController);

// ============================================================================
// ORDER ASSIGNMENT ROUTES (Admin)
// ============================================================================

/**
 * GET /api/delivery/admin/pending-orders
 * Get all orders pending assignment
 */
deliveryRouter.get('/admin/pending-orders', auth, getPendingOrdersController);

/**
 * GET /api/delivery/admin/available-riders
 * Get all available riders for assignment with scores
 */
deliveryRouter.get('/admin/available-riders', auth, getAvailableRidersController);

/**
 * POST /api/delivery/admin/assign/:orderId
 * Direct assign order to a specific rider
 * Body: { riderId: string }
 */
deliveryRouter.post('/admin/assign/:orderId', auth, directAssignOrderController);

/**
 * POST /api/delivery/admin/broadcast/:orderId
 * Broadcast order to nearby riders (Admin only)
 * Body: { radiusKm?: number }
 */
deliveryRouter.post('/admin/broadcast/:orderId', auth, broadcastOrderController);

/**
 * POST /api/delivery/admin/escalate/:orderId
 * Escalate broadcast to wider radius
 */
deliveryRouter.post('/admin/escalate/:orderId', auth, escalateBroadcastController);

/**
 * POST /api/delivery/admin/cancel-assignment/:orderId
 * Cancel assignment and return order to pool
 * Body: { reason: string }
 */
deliveryRouter.post('/admin/cancel-assignment/:orderId', auth, cancelAssignmentController);

/**
 * GET /api/delivery/admin/assignment-status/:orderId
 * Get assignment status for an order
 */
deliveryRouter.get('/admin/assignment-status/:orderId', auth, getAssignmentStatusController);

export default deliveryRouter;
