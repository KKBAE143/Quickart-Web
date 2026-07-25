import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Package,
    Truck,
    CheckCircle,
    XCircle,
    ChevronRight,
    ShoppingBag,
    IndianRupee,
    Clock
} from 'lucide-react';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

const MyOrders = () => {
    const orders = useSelector(state => state.orders.order);
    const navigate = useNavigate();

    // Group orders by transaction (orders placed within same minute with same address)
    const groupedOrders = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        const sortedOrders = [...orders].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        const groups = [];
        let currentGroup = null;

        sortedOrders.forEach(order => {
            const orderTime = new Date(order.createdAt);
            const orderMinute = Math.floor(orderTime.getTime() / 60000);
            const addressId = order.delivery_address?._id || order.delivery_address;

            if (
                currentGroup &&
                currentGroup.orderMinute === orderMinute &&
                currentGroup.addressId === addressId
            ) {
                currentGroup.items.push(order);
                currentGroup.totalAmount += (order.totalAmt || order.subTotalAmt || 0);
            } else {
                currentGroup = {
                    id: order._id,
                    orderId: order.orderId,
                    orderMinute,
                    addressId,
                    items: [order],
                    totalAmount: order.totalAmt || order.subTotalAmt || 0,
                    order_status: order.order_status,
                    delivery_address: order.delivery_address,
                    createdAt: order.createdAt
                };
                groups.push(currentGroup);
            }
        });

        return groups;
    }, [orders]);

    // Get status info
    const getStatusInfo = (status) => {
        switch (status?.toUpperCase()) {
            case 'DELIVERED':
                return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'Delivered' };
            case 'CANCELLED':
                return { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: 'Cancelled' };
            case 'OUT_FOR_DELIVERY':
                return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Truck, label: 'On the way' };
            case 'PROCESSING':
            case 'PACKED':
                return { color: 'text-orange-600', bg: 'bg-orange-50', icon: Package, label: 'Packing' };
            case 'CONFIRMED':
                return { color: 'text-purple-600', bg: 'bg-purple-50', icon: CheckCircle, label: 'Confirmed' };
            default:
                return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock, label: 'Pending' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    };

    if (groupedOrders.length === 0) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag size={28} className="text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
                    <p className="text-gray-500 text-sm mb-6">Your orders will appear here</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4">
                <h1 className="text-lg font-semibold text-gray-900">My Orders</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    {groupedOrders.length} order{groupedOrders.length > 1 ? 's' : ''}
                </p>
            </div>

            {/* Orders List */}
            <div className="p-3 space-y-3">
                {groupedOrders.map((group) => {
                    const statusInfo = getStatusInfo(group.order_status);
                    const StatusIcon = statusInfo.icon;
                    const itemCount = group.items.length;
                    const firstItem = group.items[0];
                    const productImages = group.items.slice(0, 3).map(item => item.product_details?.image?.[0]).filter(Boolean);

                    return (
                        <div
                            key={group.id}
                            onClick={() => navigate(`/track-order/${group.orderId}`, {
                                state: {
                                    groupedItems: group.items,
                                    totalAmount: group.totalAmount,
                                    itemCount: itemCount
                                }
                            })}
                            className="bg-white rounded-xl border border-gray-100 p-4 active:bg-gray-50 cursor-pointer"
                        >
                            <div className="flex gap-3">
                                {/* Product Images Stack */}
                                <div className="relative w-14 h-14 flex-shrink-0">
                                    {productImages.length > 0 ? (
                                        <>
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                                                <img
                                                    src={productImages[0]}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {itemCount > 1 && (
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                                                    +{itemCount - 1}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Package size={20} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Order Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {itemCount === 1
                                                    ? firstItem.product_details?.name
                                                    : `${itemCount} items`}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatDate(group.createdAt)} • {DisplayPriceInRupees(group.totalAmount)}
                                            </p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <StatusIcon size={14} className={statusInfo.color} />
                                        <span className={`text-xs font-medium ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom spacing */}
            <div className="h-4" />
        </div>
    );
};

export default MyOrders;
