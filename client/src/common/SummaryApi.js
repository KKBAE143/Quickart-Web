// In development with Vite proxy, use empty string so requests go through proxy
// In production, use the configured API URL
export const baseURL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL

const SummaryApi = {
    register : {
        url : '/api/user/register',
        method : 'post'
    },
    login : {
        url : '/api/user/login',
        method : 'post'
    },
    sendOtp : {
        url : '/api/user/send-otp',
        method : 'post'
    },
    verifyOtp : {
        url : '/api/user/verify-otp',
        method : 'post'
    },
    riderRegister : {
        url : '/api/user/register-rider',
        method : 'post'
    },
    forgot_password : {
        url : "/api/user/forgot-password",
        method : 'put'
    },
    forgot_password_otp_verification : {
        url : 'api/user/verify-forgot-password-otp',
        method : 'put'
    },
    resetPassword : {
        url : "/api/user/reset-password",
        method : 'put'
    },
    refreshToken : {
        url : 'api/user/refresh-token',
        method : 'post'
    },
    userDetails : {
        url : '/api/user/user-details',
        method : "get"
    },
    logout : {
        url : "/api/user/logout",
        method : 'get'
    },
    uploadAvatar : {
        url : "/api/user/upload-avatar",
        method : 'put'
    },
    updateUserDetails : {
        url : '/api/user/update-user',
        method : 'put'
    },
    addCategory : {
        url : '/api/category/add-category',
        method : 'post'
    },
    uploadImage : {
        url : '/api/file/upload',
        method : 'post'
    },
    uploadImagePublic : {
        url : '/api/file/upload-public',
        method : 'post'
    },
    getCategory : {
        url : '/api/category/get',
        method : 'get'
    },
    updateCategory : {
        url : '/api/category/update',
        method : 'put'
    },
    deleteCategory : {
        url : '/api/category/delete',
        method : 'delete'
    },
    createSubCategory : {
        url : '/api/subcategory/create',
        method : 'post'
    },
    getSubCategory : {
        url : '/api/subcategory/get',
        method : 'post'
    },
    updateSubCategory : {
        url : '/api/subcategory/update',
        method : 'put'
    },
    deleteSubCategory : {
        url : '/api/subcategory/delete',
        method : 'delete'
    },
    createProduct : {
        url : '/api/product/create',
        method : 'post'
    },
    getProduct : {
        url : '/api/product/get',
        method : 'post'
    },
    getProductByCategory : {
        url : '/api/product/get-product-by-category',
        method : 'post'
    },
    getProductByCategoryAndSubCategory : {
        url : '/api/product/get-pruduct-by-category-and-subcategory',
        method : 'post'
    },
    getProductDetails : {
        url : '/api/product/get-product-details',
        method : 'post'
    },
    updateProductDetails : {
        url : "/api/product/update-product-details",
        method : 'put'
    },
    deleteProduct : {
        url : "/api/product/delete-product",
        method : 'delete'
    },
    searchProduct : {
        url : '/api/product/search-product',
        method : 'post'
    },
    searchProductsWithFilters : {
        url : '/api/product/search-with-filters',
        method : 'post'
    },
    getAllBrands : {
        url : '/api/product/brands',
        method : 'get'
    },
    getPriceRange : {
        url : '/api/product/price-range',
        method : 'get'
    },
    addTocart : {
        url : "/api/cart/create",
        method : 'post'
    },
    getCartItem : {
        url : '/api/cart/get',
        method : 'get'
    },
    updateCartItemQty : {
        url : '/api/cart/update-qty',
        method : 'put'
    },
    deleteCartItem : {
        url : '/api/cart/delete-cart-item',
        method : 'delete'
    },
    createAddress : {
        url : '/api/address/create',
        method : 'post'
    },
    getAddress : {
        url : '/api/address/get',
        method : 'get'
    },
    updateAddress : {
        url : '/api/address/update',
        method : 'put'
    },
    disableAddress : {
        url : '/api/address/disable',
        method : 'delete'
    },
    // New location-specific endpoints
    updateAddressLocation : {
        url : '/api/address/update-location',
        method : 'put'
    },
    verifyAddressLocation : {
        url : '/api/address/verify-location',
        method : 'post'
    },
    getAddressDetails : {
        url : '/api/address/details',  // Append /:addressId
        method : 'get'
    },
    findNearbyAddresses : {
        url : '/api/address/nearby',
        method : 'get'
    },
    calculateDeliveryDistance : {
        url : '/api/address/calculate-distance',
        method : 'post'
    },
    CashOnDeliveryOrder : {
        url : "/api/order/cash-on-delivery",
        method : 'post'
    },
    payment_url : {
        url : "/api/order/checkout",
        method : 'post'
    },
    razorpay_checkout : {
        url : "/api/order/razorpay-checkout",
        method : 'post'
    },
    razorpay_verify : {
        url : "/api/order/razorpay-verify",
        method : 'post'
    },
    partial_prepayment_checkout : {
        url : "/api/order/partial-prepayment-checkout",
        method : 'post'
    },
    partial_prepayment_verify : {
        url : "/api/order/partial-prepayment-verify",
        method : 'post'
    },
    getOrderHistory : {
        url : '/api/order/order-list',
        method : 'get'
    },
    getAllOrders : {
        url : '/api/order/all-orders',
        method : 'get'
    },
    updateOrderStatus : {
        url : '/api/order/update-status',
        method : 'put'
    },
    trackOrder : {
        url : '/api/order/track/:orderId',
        method : 'get'
    },
    getOrderItems : {
        url : '/api/order/order-list',
        method : 'get'
    },
    // Review endpoints
    createReview : {
        url : '/api/review/create',
        method : 'post'
    },
    getProductReviews : {
        url : '/api/review/product',
        method : 'get'
    },
    markReviewHelpful : {
        url : '/api/review/helpful',
        method : 'put'
    },
    getUserReviews : {
        url : '/api/review/user',
        method : 'get'
    },
    updateReview : {
        url : '/api/review/update',
        method : 'put'
    },
    deleteReview : {
        url : '/api/review/delete',
        method : 'delete'
    },
    checkCanReview : {
        url : '/api/review/can-review',
        method : 'get'
    },
    // Admin review endpoints
    adminRespondToReview : {
        url : '/api/review/admin/respond',
        method : 'put'
    },
    adminUpdateReviewStatus : {
        url : '/api/review/admin/status',
        method : 'put'
    },
    adminGetAllReviews : {
        url : '/api/review/admin/all',
        method : 'get'
    },
    // Wishlist endpoints
    addToWishlist : {
        url : '/api/wishlist/add',
        method : 'post'
    },
    removeFromWishlist : {
        url : '/api/wishlist/remove',
        method : 'delete'
    },
    getWishlist : {
        url : '/api/wishlist',
        method : 'get'
    },
    moveToCart : {
        url : '/api/wishlist/move-to-cart',
        method : 'post'
    },
    checkWishlist : {
        url : '/api/wishlist/check',
        method : 'get'
    },
    getWishlistCount : {
        url : '/api/wishlist/count',
        method : 'get'
    },
    clearWishlist : {
        url : '/api/wishlist/clear',
        method : 'delete'
    },
    // Recommendation endpoints
    getSimilarProducts : {
        url : '/api/recommendation/similar/:productId',
        method : 'get'
    },
    getFrequentlyBoughtTogether : {
        url : '/api/recommendation/frequently-bought-together/:productId',
        method : 'get'
    },
    getTrendingProducts : {
        url : '/api/recommendation/trending',
        method : 'get'
    },
    getRecommendedForYou : {
        url : '/api/recommendation/for-you',
        method : 'get'
    },
    getCategoryRecommendations : {
        url : '/api/recommendation/category/:categoryId',
        method : 'get'
    },
    trackProductView : {
        url : '/api/recommendation/track-view/:productId',
        method : 'post'
    },
    // Chat endpoints
    createChatRoom : {
        url : '/api/chat/create',
        method : 'post'
    },
    getChatMessages : {
        url : '/api/chat/messages/:orderId',
        method : 'get'
    },
    saveChatMessage : {
        url : '/api/chat/save',
        method : 'post'
    },
    markMessagesRead : {
        url : '/api/chat/read/:orderId',
        method : 'put'
    },
    getChatRoom : {
        url : '/api/chat/room/:orderId',
        method : 'get'
    },
    // Socket endpoints
    socketConnect : {
        url : '/api/socket/connect',
        method : 'post'
    },
    socketDisconnect : {
        url : '/api/socket/disconnect',
        method : 'post'
    },
    getSocketStatus : {
        url : '/api/socket/status/:userId',
        method : 'get'
    },
    // Order tracking
    trackOrder : {
        url : '/api/order/track/:orderId',
        method : 'get'
    },

    // ============================================================================
    // DELIVERY PARTNER ENDPOINTS
    // ============================================================================
    delivery: {
        // Dashboard & Profile
        dashboard: {
            url: '/api/delivery/dashboard',
            method: 'get'
        },
        toggleStatus: {
            url: '/api/delivery/toggle-status',
            method: 'post'
        },

        // Location Tracking
        updateLocation: {
            url: '/api/delivery/location',
            method: 'post'
        },
        locationHistory: {
            url: '/api/delivery/location-history', // Append /:orderId
            method: 'get'
        },

        // Order Management
        availableOrders: {
            url: '/api/delivery/available-orders',
            method: 'get'
        },
        activeOrder: {
            url: '/api/delivery/active-order',
            method: 'get'
        },
        acceptOrder: {
            url: '/api/delivery/accept', // Append /:orderId
            method: 'post'
        },
        declineOrder: {
            url: '/api/delivery/decline', // Append /:orderId
            method: 'post'
        },
        arrivedAtStore: {
            url: '/api/delivery/arrived-store', // Append /:orderId
            method: 'post'
        },
        pickedUp: {
            url: '/api/delivery/picked-up', // Append /:orderId
            method: 'post'
        },
        reachedCustomer: {
            url: '/api/delivery/reached', // Append /:orderId
            method: 'post'
        },
        verifyOtp: {
            url: '/api/delivery/verify-otp', // Append /:orderId
            method: 'post'
        },
        resendOtp: {
            url: '/api/delivery/resend-otp', // Append /:orderId
            method: 'post'
        },
        markFailed: {
            url: '/api/delivery/failed', // Append /:orderId
            method: 'post'
        },
        orderHistory: {
            url: '/api/delivery/order-history',
            method: 'get'
        },

        // Wallet & Earnings
        wallet: {
            url: '/api/delivery/wallet',
            method: 'get'
        },
        earnings: {
            url: '/api/delivery/earnings',
            method: 'get'
        },

        // Admin Functions
        onlineRiders: {
            url: '/api/delivery/admin/online-riders',
            method: 'get'
        },
        allAgents: {
            url: '/api/delivery/admin/all-agents',
            method: 'get'
        },
        updateAgentStatus: {
            url: '/api/delivery/admin/agent', // Append /:agentId/status
            method: 'put'
        },
        riderDetails: {
            url: '/api/delivery/admin/rider', // Append /:riderId
            method: 'get'
        },
        broadcastOrder: {
            url: '/api/delivery/admin/broadcast', // Append /:orderId
            method: 'post'
        },

        // Order Assignment (Admin)
        pendingOrders: {
            url: '/api/delivery/admin/pending-orders',
            method: 'get'
        },
        availableRiders: {
            url: '/api/delivery/admin/available-riders',
            method: 'get'
        },
        directAssign: {
            url: '/api/delivery/admin/assign', // Append /:orderId
            method: 'post'
        },
        escalateBroadcast: {
            url: '/api/delivery/admin/escalate', // Append /:orderId
            method: 'post'
        },
        cancelAssignment: {
            url: '/api/delivery/admin/cancel-assignment', // Append /:orderId
            method: 'post'
        },
        assignmentStatus: {
            url: '/api/delivery/admin/assignment-status', // Append /:orderId
            method: 'get'
        },

        // Store Management
        getStores: {
            url: '/api/delivery/stores',
            method: 'get'
        },
        upsertStore: {
            url: '/api/delivery/stores',
            method: 'post'
        }
    }
}

export default SummaryApi