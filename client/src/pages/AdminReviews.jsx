import React, { useState, useEffect } from 'react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import {
    Star,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    MessageSquare,
    Filter,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ImageIcon,
    User,
    Package,
    BadgeCheck,
    X,
    ThumbsUp,
    ThumbsDown,
    MessageCircle
} from 'lucide-react';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        rating: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [adminResponse, setAdminResponse] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, [pagination.page, filters]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.status && { status: filters.status }),
                ...(filters.rating && { rating: filters.rating })
            });

            const response = await Axios({
                method: 'get',
                url: `${SummaryApi.adminGetAllReviews.url}?${params}`
            });

            if (response.data.success) {
                setReviews(response.data.data.reviews);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResponse = async () => {
        if (!adminResponse.trim()) {
            toast.error('Please enter a response');
            return;
        }

        try {
            const response = await Axios({
                method: 'put',
                url: `${SummaryApi.adminRespondToReview.url}/${selectedReview._id}`,
                data: { response: adminResponse }
            });

            if (response.data.success) {
                toast.success('Response added successfully');
                setShowResponseModal(false);
                setAdminResponse('');
                setSelectedReview(null);
                fetchReviews();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleUpdateStatus = async () => {
        if (!newStatus) {
            toast.error('Please select a status');
            return;
        }

        if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            const response = await Axios({
                method: 'put',
                url: `${SummaryApi.adminUpdateReviewStatus.url}/${selectedReview._id}`,
                data: {
                    status: newStatus,
                    rejection_reason: rejectionReason
                }
            });

            if (response.data.success) {
                toast.success(`Review ${newStatus.toLowerCase()} successfully`);
                setShowStatusModal(false);
                setNewStatus('');
                setRejectionReason('');
                setSelectedReview(null);
                fetchReviews();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const config = {
            APPROVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
            PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
            REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle }
        };
        const { bg, text, border, icon: Icon } = config[status] || config.PENDING;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${bg} ${text} ${border}`}>
                <Icon size={12} /> {status}
            </span>
        );
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                ))}
                <span className="ml-1 text-sm font-medium text-gray-700">{rating}.0</span>
            </div>
        );
    };

    const filteredReviews = reviews.filter(review => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            review.title?.toLowerCase().includes(search) ||
            review.review?.toLowerCase().includes(search) ||
            review.userId?.name?.toLowerCase().includes(search) ||
            review.productId?.name?.toLowerCase().includes(search)
        );
    });

    // Stats calculation
    const stats = {
        total: pagination.total,
        approved: reviews.filter(r => r.status === 'APPROVED').length,
        pending: reviews.filter(r => r.status === 'PENDING').length,
        rejected: reviews.filter(r => r.status === 'REJECTED').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Star className="text-red-500" size={28} />
                            Review Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Manage customer reviews and feedback
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchReviews}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <MessageSquare size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-sm text-green-600">Approved</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-yellow-500" />
                            <span className="text-sm text-yellow-600">Pending</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                            <XCircle size={16} className="text-red-500" />
                            <span className="text-sm text-red-600">Rejected</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by product, user, or review text..."
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all min-w-[140px]"
                    >
                        <option value="">All Status</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING">Pending</option>
                        <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Rating Filter */}
                    <select
                        value={filters.rating}
                        onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all min-w-[140px]"
                    >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && pagination.page === 1 && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm">Loading reviews...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredReviews.length === 0 && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Reviews Found</h3>
                    <p className="text-gray-500 text-sm">
                        {searchTerm || filters.status || filters.rating
                            ? 'Try adjusting your filters'
                            : 'No reviews submitted yet'}
                    </p>
                </div>
            )}

            {/* Reviews List */}
            {!loading && filteredReviews.length > 0 && (
                <div className="space-y-4">
                    {filteredReviews.map((review) => (
                        <div
                            key={review._id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                {/* Review Header */}
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4">
                                        {/* Product Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                            {review.productId?.image?.[0] ? (
                                                <img
                                                    src={review.productId.image[0]}
                                                    alt={review.productId.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package size={24} className="text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {review.productId?.name || 'Product'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                <User size={12} />
                                                <span>{review.userId?.name || 'User'}</span>
                                                {review.verified_purchase && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        <BadgeCheck size={10} /> Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                {renderStars(review.rating)}
                                                <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(review.status)}
                                </div>

                                {/* Review Content */}
                                <div className="mb-4">
                                    {review.title && (
                                        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                                    )}
                                    <p className="text-gray-600 leading-relaxed">{review.review}</p>
                                </div>

                                {/* Review Images */}
                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                        {review.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Review ${index + 1}`}
                                                onClick={() => setSelectedImage(image)}
                                                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-400 transition-colors flex-shrink-0"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Admin Response */}
                                {review.admin_response?.text && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl mb-4">
                                        <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                                            <MessageCircle size={12} /> Admin Response
                                        </p>
                                        <p className="text-sm text-gray-700">{review.admin_response.text}</p>
                                        <p className="text-xs text-gray-500 mt-2">{formatDate(review.admin_response.responded_at)}</p>
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {review.status === 'REJECTED' && review.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                                        <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                                        <p className="text-sm text-gray-700">{review.rejection_reason}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            setSelectedReview(review);
                                            setAdminResponse(review.admin_response?.text || '');
                                            setShowResponseModal(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <MessageSquare size={14} />
                                        {review.admin_response?.text ? 'Edit Response' : 'Respond'}
                                    </button>

                                    {review.status !== 'APPROVED' && (
                                        <button
                                            onClick={() => {
                                                setSelectedReview(review);
                                                setNewStatus('APPROVED');
                                                setShowStatusModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <ThumbsUp size={14} />
                                            Approve
                                        </button>
                                    )}

                                    {review.status !== 'REJECTED' && (
                                        <button
                                            onClick={() => {
                                                setSelectedReview(review);
                                                setNewStatus('REJECTED');
                                                setRejectionReason(review.rejection_reason || '');
                                                setShowStatusModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <ThumbsDown size={14} />
                                            Reject
                                        </button>
                                    )}

                                    {review.status === 'PENDING' && (
                                        <span className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                                            <Clock size={14} />
                                            Awaiting Action
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                            <div className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    disabled={pagination.page === 1}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                                    {pagination.page} / {pagination.totalPages}
                                </div>
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Response Modal */}
            {showResponseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-blue-600 text-white p-5">
                            <h2 className="text-lg font-bold">
                                {selectedReview?.admin_response?.text ? 'Edit Admin Response' : 'Add Admin Response'}
                            </h2>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Response Message
                            </label>
                            <textarea
                                value={adminResponse}
                                onChange={(e) => setAdminResponse(e.target.value)}
                                placeholder="Write your response to the customer..."
                                rows={5}
                                className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900 resize-none"
                            />
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={handleAddResponse}
                                className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
                            >
                                Submit Response
                            </button>
                            <button
                                onClick={() => {
                                    setShowResponseModal(false);
                                    setAdminResponse('');
                                    setSelectedReview(null);
                                }}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className={`p-5 ${newStatus === 'APPROVED' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            <h2 className="text-lg font-bold">
                                {newStatus === 'APPROVED' ? 'Approve Review' : 'Reject Review'}
                            </h2>
                        </div>
                        <div className="p-6">
                            {newStatus === 'REJECTED' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain why this review is being rejected..."
                                        rows={4}
                                        className="w-full p-3.5 bg-gray-50 outline-none border border-gray-200 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/5 rounded-xl transition-all text-gray-900 resize-none"
                                    />
                                </div>
                            )}

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <p className="text-sm text-gray-700">
                                    Are you sure you want to <strong>{newStatus.toLowerCase()}</strong> this review?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={handleUpdateStatus}
                                className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors ${
                                    newStatus === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                Confirm {newStatus === 'APPROVED' ? 'Approval' : 'Rejection'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setNewStatus('');
                                    setRejectionReason('');
                                    setSelectedReview(null);
                                }}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={selectedImage}
                            alt="Review"
                            className="max-w-full max-h-[90vh] object-contain rounded-xl"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
