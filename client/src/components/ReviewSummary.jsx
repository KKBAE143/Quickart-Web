import React from 'react';
import { FaStar } from 'react-icons/fa';

const ReviewSummary = ({ stats }) => {
    if (!stats || !stats.total_reviews) {
        return null;
    }

    const { total_reviews, average_rating, rating_distribution } = stats;

    const distribution = [
        { stars: 5, count: rating_distribution?.five_star || 0 },
        { stars: 4, count: rating_distribution?.four_star || 0 },
        { stars: 3, count: rating_distribution?.three_star || 0 },
        { stars: 2, count: rating_distribution?.two_star || 0 },
        { stars: 1, count: rating_distribution?.one_star || 0 }
    ];

    const getPercentage = (count) => {
        if (total_reviews === 0) return 0;
        return Math.round((count / total_reviews) * 100);
    };

    const renderStars = (rating, size = 'text-base') => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={`${
                            star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
                        } ${size}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Overall Rating - Compact */}
                <div className="flex flex-col items-center md:items-start">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Customer Reviews</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-4xl font-bold text-gray-900">
                            {average_rating.toFixed(1)}
                        </div>
                        <div className="flex items-center">
                            {renderStars(average_rating, 'text-lg')}
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        Based on {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
                    </p>
                    {/* Recommendation Badge - Inline */}
                    {average_rating >= 4.0 && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                            <div className="text-xl">🏆</div>
                            <div>
                                <p className="text-xs font-semibold text-green-900">Highly Rated</p>
                                <p className="text-xs text-green-700">
                                    {Math.round(((distribution[0].count + distribution[1].count) / total_reviews) * 100)}% rate 4★+
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rating Distribution - Compact */}
                <div className="flex-1 space-y-2">
                    {distribution.map(({ stars, count }) => {
                        const percentage = getPercentage(count);
                        return (
                            <div key={stars} className="flex items-center gap-2">
                                <div className="flex items-center gap-1 w-10">
                                    <span className="text-xs font-semibold text-gray-700">{stars}</span>
                                    <FaStar className="text-yellow-400 text-xs" />
                                </div>
                                
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                
                                <div className="w-20 text-right">
                                    <span className="text-xs font-medium text-gray-600">
                                        {percentage}% ({count})
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ReviewSummary;

