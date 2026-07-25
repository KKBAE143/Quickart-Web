import React, { useState, useEffect } from 'react';
import { FaStar, FaUpload, FaTimes } from 'react-icons/fa';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import uploadImage from '../utils/UploadImage';
import { cleanImageArray, isValidImageUrl, safeEncodeImageUrl } from '../utils/validateImageUrl';

const ReviewForm = ({ productId, orderId, onSuccess, onCancel, existingReview = null }) => {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState(existingReview?.title || '');
    const [review, setReview] = useState(existingReview?.review || '');
    const [images, setImages] = useState(cleanImageArray(existingReview?.images));
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        
        if (images.length + files.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const response = await uploadImage(file);
                
                // Check different possible response structures
                if (response?.data?.data?.url) {
                    return response.data.data.url;
                } else if (response?.data?.url) {
                    return response.data.url;
                } else {
                    console.error("Unexpected response structure:", response);
                    throw new Error("Invalid upload response");
                }
            });
            const uploadedUrls = await Promise.all(uploadPromises);
            // Filter out any null/invalid URLs before adding to state
            const validUrls = uploadedUrls.filter(url => url && typeof url === 'string' && url.startsWith('http'));
            setImages([...images, ...validUrls]);
            toast.success('Images uploaded successfully');
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Failed to upload images. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        if (!title.trim()) {
            toast.error('Please enter a review title');
            return;
        }

        if (!review.trim() || review.trim().length < 10) {
            toast.error('Review must be at least 10 characters long');
            return;
        }

        setSubmitting(true);
        try {
            const endpoint = existingReview 
                ? `${SummaryApi.updateReview.url}/${existingReview._id}`
                : SummaryApi.createReview.url;
            
            const method = existingReview ? 'put' : 'post';

            const data = {
                productId,
                orderId,
                rating,
                title: title.trim(),
                review: review.trim(),
                images
            };

            const response = await Axios({
                method,
                url: endpoint,
                data
            });

            if (response.data.success) {
                toast.success(existingReview ? 'Review updated successfully' : 'Review submitted successfully');
                if (onSuccess) onSuccess(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {existingReview ? 'Edit Your Review' : 'Write a Review'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Stars */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Your Rating *
                    </label>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="text-4xl transition-all duration-200 hover:scale-110 focus:outline-none"
                            >
                                <FaStar
                                    className={`${
                                        star <= (hoverRating || rating)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="ml-3 text-lg font-semibold text-gray-700">
                                {rating === 1 && 'Poor'}
                                {rating === 2 && 'Fair'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Review Title */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Review Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Great product, highly recommended!"
                        maxLength={100}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        required
                    />
                    <p className="text-sm text-gray-500 mt-1">{title.length}/100 characters</p>
                </div>

                {/* Review Text */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Review *
                    </label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience with this product..."
                        rows={6}
                        maxLength={1000}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                        required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        {review.length}/1000 characters (minimum 10)
                    </p>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Add Photos (Optional)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                        {images.filter(isValidImageUrl).map((image, index) => {
                            const safeImageUrl = safeEncodeImageUrl(image);
                            
                            return (
                                <div key={index} className="relative group">
                                    <img
                                        src={safeImageUrl}
                                        alt={`Review ${index + 1}`}
                                        onError={(e) => {
                                            console.error('[ReviewForm] Failed to load image:', image);
                                            e.target.style.display = 'none';
                                        }}
                                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                                        crossOrigin="anonymous"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                                    >
                                        <FaTimes className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                        {images.length < 5 && (
                            <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all">
                                <FaUpload className="text-gray-400 text-xl mb-1" />
                                <span className="text-xs text-gray-500">Upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        📸 Add up to 5 photos (Photo reviews get more helpful votes!)
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={submitting || uploading}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 sm:flex-initial border-2 border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Verified Purchase Badge */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Verified Purchase - Your review will be marked as a verified buyer
                </p>
            </div>
        </div>
    );
};

export default ReviewForm;

