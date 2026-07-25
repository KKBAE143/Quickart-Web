import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setWishlist, removeFromWishlist, setWishlistLoading } from '../store/wishlistSlice';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { valideURLConvert } from '../utils/valideURLConvert';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import {
    Heart,
    ShoppingCart,
    Trash2,
    ArrowRight,
    AlertCircle,
    Loader2,
    ShoppingBag,
    Percent
} from 'lucide-react';
import { useGlobalContext } from '../provider/GlobalProvider';

const WishlistPage = () => {
    const wishlist = useSelector(state => state.wishlist.wishlist);
    const loading = useSelector(state => state.wishlist.loading);
    const user = useSelector(state => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { fetchCartItem } = useGlobalContext();
    const [movingToCart, setMovingToCart] = useState({});
    const [removing, setRemoving] = useState({});

    useEffect(() => {
        if (!user?._id) {
            navigate('/login');
            return;
        }
        fetchWishlist();
    }, [user]);

    const fetchWishlist = async () => {
        try {
            dispatch(setWishlistLoading(true));
            const response = await Axios({
                ...SummaryApi.getWishlist
            });
            if (response.data.success) {
                dispatch(setWishlist(response.data.data));
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            dispatch(setWishlistLoading(false));
        }
    };

    const handleRemove = async (productId) => {
        try {
            setRemoving(prev => ({ ...prev, [productId]: true }));
            const response = await Axios({
                ...SummaryApi.removeFromWishlist,
                url: `${SummaryApi.removeFromWishlist.url}/${productId}`
            });
            if (response.data.success) {
                dispatch(removeFromWishlist(productId));
                toast.success("Removed from wishlist");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setRemoving(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleMoveToCart = async (productId) => {
        try {
            setMovingToCart(prev => ({ ...prev, [productId]: true }));
            const response = await Axios({
                ...SummaryApi.moveToCart,
                url: `${SummaryApi.moveToCart.url}/${productId}`
            });
            if (response.data.success) {
                dispatch(removeFromWishlist(productId));
                fetchCartItem();
                toast.success("Moved to cart successfully");
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setMovingToCart(prev => ({ ...prev, [productId]: false }));
        }
    };

    if (!user?._id) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                    </div>
                    <p className="text-gray-500">Loading wishlist...</p>
                </div>
            </div>
        );
    }

    if (wishlist.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-md mx-auto">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart size={36} className="text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Save items you love for later. Start adding products to your wishlist!
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                        >
                            <ShoppingBag size={18} />
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                                <Heart size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Wishlist</h1>
                                <p className="text-gray-500 text-sm">
                                    {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wishlist Grid */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {wishlist.map((item) => {
                        const product = item.productId;
                        if (!product) return null;

                        const productImage = product.image && product.image.length > 0
                            ? product.image[0]
                            : '/placeholder-product.png';

                        const productUrl = `/product/${valideURLConvert(product.name)}-${product._id}`;
                        const finalPrice = pricewithDiscount(product.price, product.discount);
                        const isMoving = movingToCart[product._id];
                        const isRemoving = removing[product._id];
                        const isOutOfStock = product.stock !== undefined && product.stock === 0;

                        return (
                            <div
                                key={item._id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200"
                            >
                                {/* Product Image */}
                                <Link to={productUrl} className="block">
                                    <div className="relative aspect-square bg-gray-50 overflow-hidden group">
                                        <img
                                            src={productImage}
                                            alt={product.name || 'Product'}
                                            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        {product.discount && product.discount > 0 && (
                                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
                                                <Percent size={12} />
                                                {product.discount}% OFF
                                            </div>
                                        )}
                                        {isOutOfStock && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                                <div className="bg-white text-gray-900 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm">
                                                    <AlertCircle size={16} />
                                                    Out of Stock
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Product Details */}
                                <div className="p-4">
                                    <Link to={productUrl}>
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 hover:text-gray-700 transition-colors text-sm">
                                            {product.name || 'Product'}
                                        </h3>
                                    </Link>

                                    {product.unit && (
                                        <p className="text-xs text-gray-500 mb-3">{product.unit}</p>
                                    )}

                                    {/* Price */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-lg font-bold text-gray-900">
                                            {DisplayPriceInRupees(finalPrice || 0)}
                                        </span>
                                        {product.discount && product.discount > 0 && product.price && (
                                            <span className="text-sm text-gray-400 line-through">
                                                {DisplayPriceInRupees(product.price)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleMoveToCart(product._id)}
                                            disabled={isMoving || isOutOfStock}
                                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                                                isOutOfStock
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                                            }`}
                                        >
                                            {isMoving ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Moving...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart size={16} />
                                                    Move to Cart
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => handleRemove(product._id)}
                                            disabled={isRemoving}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                        >
                                            {isRemoving ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Removing...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 size={16} />
                                                    Remove
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Continue Shopping */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-xl font-medium transition-colors"
                    >
                        <ShoppingBag size={18} />
                        Continue Shopping
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;
