import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

// Import App immediately (required for layout)
import App from "../App";

// Lazy load components for code splitting
const Home = lazy(() => import("../pages/Home"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const RiderRegister = lazy(() => import("../pages/RiderRegister"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const OtpVerification = lazy(() => import("../pages/OtpVerification"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const UserMenuMobile = lazy(() => import("../pages/UserMenuMobile"));
const Dashboard = lazy(() => import("../layouts/Dashboard"));
const Profile = lazy(() => import("../pages/Profile"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const MyOrders = lazy(() => import("../pages/MyOrders"));
const Address = lazy(() => import("../pages/Address"));
const CategoryPage = lazy(() => import("../pages/CategoryPage"));
const SubCategoryPage = lazy(() => import("../pages/SubCategoryPage"));
const UploadProduct = lazy(() => import("../pages/UploadProduct"));
const ProductAdmin = lazy(() => import("../pages/ProductAdmin"));
// HIDDEN: Reviews feature temporarily disabled
// const AdminReviews = lazy(() => import("../pages/AdminReviews"));
const AdminOrders = lazy(() => import("../pages/AdminOrders"));
const AdminPermision = lazy(() => import("../layouts/AdminPermision"));
const ProductListPage = lazy(() => import("../pages/ProductListPage"));
const ProductDisplayPage = lazy(() => import("../pages/ProductDisplayPage"));
const CartMobile = lazy(() => import("../pages/CartMobile"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));
const Success = lazy(() => import("../pages/Success"));
const Cancel = lazy(() => import("../pages/Cancel"));
const TrackOrderPage = lazy(() => import("../pages/TrackOrderPage"));
const WishlistPage = lazy(() => import("../pages/WishlistPage"));

// Delivery Partner Pages
const DeliveryDashboard = lazy(() => import("../pages/DeliveryDashboard"));
const ActiveOrderPage = lazy(() => import("../pages/ActiveOrderPage"));
const RiderWalletPage = lazy(() => import("../pages/RiderWalletPage"));
const RiderOrdersPage = lazy(() => import("../pages/RiderOrdersPage"));

// Admin Rider Tracking
const AdminRiderTracking = lazy(() => import("../pages/AdminRiderTracking"));

// Admin Agent Management Pages
const AdminAgents = lazy(() => import("../pages/AdminAgents"));
const AdminPayouts = lazy(() => import("../pages/AdminPayouts"));
const AdminAgentAnalytics = lazy(() => import("../pages/AdminAgentAnalytics"));

// Delivery Layout
const DeliveryLayout = lazy(() => import("../layouts/DeliveryLayout"));

// Admin Layout
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));



// Loading component for Suspense fallback
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
        </div>
    </div>
);

// Wrapper component for Suspense
const LazyElement = ({ children }) => (
    <Suspense fallback={<PageLoader />}>
        {children}
    </Suspense>
);

const router = createBrowserRouter([
    {
        path : "/",
        element : <App/>,
        children : [
            {
                path : "",
                element : <LazyElement><Home/></LazyElement>
            },
            {
                path : "search",
                element : <LazyElement><SearchPage/></LazyElement>
            },
            {
                path : 'login',
                element : <LazyElement><Login/></LazyElement>
            },
            {
                path : "register",
                element : <LazyElement><Register/></LazyElement>
            },
            {
                path : "register-rider",
                element : <LazyElement><RiderRegister/></LazyElement>
            },
            {
                path : "forgot-password",
                element : <LazyElement><ForgotPassword/></LazyElement>
            },
            {
                path : "verification-otp",
                element : <LazyElement><OtpVerification/></LazyElement>
            },
            {
                path : "reset-password",
                element : <LazyElement><ResetPassword/></LazyElement>
            },
            {
                path : "user",
                element : <LazyElement><UserMenuMobile/></LazyElement>
            },
            {
                path : "dashboard",
                element : <LazyElement><AdminLayout/></LazyElement>,
                children : [
                    {
                        path : "",
                        element : <LazyElement><AdminDashboard/></LazyElement>
                    },
                    {
                        path : "profile",
                        element : <LazyElement><Profile/></LazyElement>
                    },
                    {
                        path : "myorders",
                        element : <LazyElement><MyOrders/></LazyElement>
                    },
                    {
                        path : "address",
                        element : <LazyElement><Address/></LazyElement>
                    },
                    {
                        path : 'category',
                        element : <LazyElement><AdminPermision><CategoryPage/></AdminPermision></LazyElement>
                    },
                    {
                        path : "subcategory",
                        element : <LazyElement><AdminPermision><SubCategoryPage/></AdminPermision></LazyElement>
                    },
                    {
                        path : 'upload-product',
                        element : <LazyElement><AdminPermision><UploadProduct/></AdminPermision></LazyElement>
                    },
                    {
                        path : 'product',
                        element : <LazyElement><AdminPermision><ProductAdmin/></AdminPermision></LazyElement>
                    },
                    // HIDDEN: Reviews feature temporarily disabled
                    // {
                    //     path : 'reviews',
                    //     element : <LazyElement><AdminPermision><AdminReviews/></AdminPermision></LazyElement>
                    // },
                    {
                        path : 'admin-orders',
                        element : <LazyElement><AdminPermision><AdminOrders/></AdminPermision></LazyElement>
                    },
                    {
                        path : 'agents',
                        element : <LazyElement><AdminPermision><AdminAgents/></AdminPermision></LazyElement>
                    },
                    {
                        path : 'payouts',
                        element : <LazyElement><AdminPermision><AdminPayouts/></AdminPermision></LazyElement>
                    },
                    {
                        path : 'agent-analytics',
                        element : <LazyElement><AdminPermision><AdminAgentAnalytics/></AdminPermision></LazyElement>
                    },
                    {
                        path : 'rider-tracking',
                        element : <LazyElement><AdminPermision><AdminRiderTracking/></AdminPermision></LazyElement>
                    }
                ]
            },
            {
                path : ":category",
                children : [
                    {
                        path : ":subCategory",
                        element : <LazyElement><ProductListPage/></LazyElement>
                    }
                ]
            },
            {
                path : "product/:product",
                element : <LazyElement><ProductDisplayPage/></LazyElement>
            },
            {
                path : 'cart',
                element : <LazyElement><CartMobile/></LazyElement>
            },
            {
                path : 'wishlist',
                element : <LazyElement><WishlistPage/></LazyElement>
            },
            {
                path : "checkout",
                element : <LazyElement><CheckoutPage/></LazyElement>
            },
            {
                path : "success",
                element : <LazyElement><Success/></LazyElement>
            },
            {
                path : 'cancel',
                element : <LazyElement><Cancel/></LazyElement>
            },
            {
                path : "track-order/:orderId",
                element : <LazyElement><TrackOrderPage/></LazyElement>
            },


            // Delivery Partner Routes
            {
                path : "delivery",
                element : <LazyElement><DeliveryLayout/></LazyElement>,
                children: [
                    {
                        path : "",
                        element : <LazyElement><DeliveryDashboard/></LazyElement>
                    },
                    {
                        path : "active-order",
                        element : <LazyElement><ActiveOrderPage/></LazyElement>
                    },
                    {
                        path : "wallet",
                        element : <LazyElement><RiderWalletPage/></LazyElement>
                    },
                    {
                        path : "orders",
                        element : <LazyElement><RiderOrdersPage/></LazyElement>
                    },
                    {
                        path : "profile",
                        element : <LazyElement><Profile/></LazyElement>
                    }
                ]
            }
        ]
    }
])

export default router