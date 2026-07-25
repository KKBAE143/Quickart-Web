import React, { useState, useEffect } from 'react';
import { FaStar, FaThumbsUp, FaRegThumbsUp, FaCheckCircle, FaImage, FaTrash, FaEdit } from 'react-icons/fa';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { isValidImageUrl, safeEncodeImageUrl } from '../utils/validateImageUrl';

const ReviewList = ({ productId, refreshTrigger = 0 }) => {
    const user = useSelector(state => state.user);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 5, // Show 5 reviews initially
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        rating: null,
        sort: 'recent',
        verified: false
    });
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchReviews(true); // true = reset reviews
    }, [productId, filters, refreshTrigger]);

    const fetchReviews = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                setLoadingMore(true);
            }

            const currentPage = reset ? 1 : pagination.page;
            
            const params = new URLSearchParams({
                page: currentPage,
                limit: pagination.limit,
                sort: filters.sort,
                ...(filters.rating && { rating: filters.rating }),
                ...(filters.verified && { verified: 'true' })
            });

            const response = await Axios({
                method: 'get',
                url: `${SummaryApi.getProductReviews.url}/${productId}?${params}`
            });

            if (response.data.success) {
                const newReviews = response.data.data.reviews;
                
                if (reset) {
                    setReviews(newReviews);
                } else {
                    setReviews(prev => [...prev, ...newReviews]);
                }
                
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        fetchReviews(false);
    };

    const handleMarkHelpful = async (reviewId) => {
        if (!user._id) {
            toast.error('Please login to mark reviews as helpful');
            return;
        }

        try {
            const response = await Axios({
                method: 'put',
                url: `${SummaryApi.markReviewHelpful.url}/${reviewId}`
            });

            if (response.data.success) {
                // Update the review in the list
                setReviews(reviews.map(review => 
                    review._id === reviewId 
                        ? {
                            ...review,
                            helpful_count: response.data.data.helpful_count,
                            helpful_by: response.data.data.marked_helpful 
                                ? [...(review.helpful_by || []), user._id]
                                : (review.helpful_by || []).filter(id => id !== user._id)
                        }
                        : review
                ));
                toast.success(response.data.message);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const response = await Axios({
                method: 'delete',
                url: `${SummaryApi.deleteReview.url}/${reviewId}`
            });

            if (response.data.success) {
                setReviews(reviews.filter(review => review._id !== reviewId));
                toast.success('Review deleted successfully');
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={`${
                            star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        } text-sm`}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading && pagination.page === 1) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Sort */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700">Sort by:</label>
                        <select
                            value={filters.sort}
                            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="helpful">Most Helpful</option>
                            <option value="rating_high">Highest Rating</option>
                            <option value="rating_low">Lowest Rating</option>
                        </select>
                    </div>

                    {/* Rating Filter */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700">Filter:</label>
                        <select
                            value={filters.rating || ''}
                            onChange={(e) => setFilters({ ...filters, rating: e.target.value ? parseInt(e.target.value) : null })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>

                    {/* Verified Filter */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.verified}
                            onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Verified only</span>
                    </label>
                </div>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <p className="text-gray-500 text-lg">No reviews found</p>
                    <p className="text-gray-400 text-sm mt-2">Be the first to review this product!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review._id}
                            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            {/* Review Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {review.userId?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">
                                                {review.userId?.name || 'Anonymous'}
                                            </h4>
                                            {review.verified_purchase && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                    <FaCheckCircle className="text-green-600" />
                                                    Verified Purchase
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                                    </div>
                                </div>
                                {renderStars(review.rating)}
                            </div>

                            {/* Review Content */}
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-900 text-lg mb-2">{review.title}</h3>
                                <p className="text-gray-700 leading-relaxed">{review.review}</p>
                            </div>

                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {review.images.filter(isValidImageUrl).map((image, index) => {
                                        const safeImageUrl = safeEncodeImageUrl(image);
                                        
                                        return (
                                            <img
                                                key={index}
                                                src={safeImageUrl}
                                                alt={`Review image ${index + 1}`}
                                                onClick={() => setSelectedImage(safeImageUrl)}
                                                onError={(e) => {
                                                    console.error('[ReviewList] Failed to load image:', image);
                                                    e.target.style.display = 'none';
                                                }}
                                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-red-500 transition-all"
                                                crossOrigin="anonymous"
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Admin Response */}
                            {review.admin_response?.text && (
                                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg mb-4">
                                    <p className="text-sm font-semibold text-red-900 mb-2">
                                        Response from Quickart
                                    </p>
                                    <p className="text-sm text-gray-700">{review.admin_response.text}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {formatDate(review.admin_response.responded_at)}
                                    </p>
                                </div>
                            )}

                            {/* Review Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleMarkHelpful(review._id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        review.helpful_by?.includes(user._id)
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {review.helpful_by?.includes(user._id) ? (
                                        <FaThumbsUp className="text-red-600" />
                                    ) : (
                                        <FaRegThumbsUp />
                                    )}
                                    <span>Helpful ({review.helpful_count || 0})</span>
                                </button>

                                {/* Delete button for admin or review owner */}
                                {(user.role === 'ADMIN' || review.userId?._id === user._id) && (
                                    <button
                                        onClick={() => handleDeleteReview(review._id)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                        title="Delete Review"
                                    >
                                        <FaTrash />
                                        <span>Delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {pagination.page < pagination.totalPages && (
                <div className="flex flex-col items-center gap-3 pt-6">
                    <p className="text-sm text-gray-600">
                        Showing {reviews.length} of {pagination.total} reviews
                    </p>
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loadingMore ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Loading...
                            </span>
                        ) : (
                            `Load More Reviews`
                        )}
                    </button>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && isValidImageUrl(selectedImage) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={selectedImage}
                            alt="Review"
                            onError={() => setSelectedImage(null)}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            crossOrigin="anonymous"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                            className="absolute top-4 right-4 bg-white text-gray-900 rounded-full p-3 hover:bg-gray-100 transition-all shadow-lg"
                        >
                            <span className="text-2xl font-bold">×</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewList;

