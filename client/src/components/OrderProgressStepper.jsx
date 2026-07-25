import React from 'react';
import { 
    FaCheckCircle, 
    FaBox, 
    FaTruck, 
    FaShippingFast, 
    FaHome,
    FaTimesCircle,
    FaMoneyBillWave
} from 'react-icons/fa';

const OrderProgressStepper = ({ orderStatus, cancelledAt, deliveredAt }) => {
    // Define order flow steps
    const normalSteps = [
        { key: 'CONFIRMED', label: 'Confirmed', icon: FaCheckCircle },
        { key: 'PACKED', label: 'Packed', icon: FaBox },
        { key: 'DISPATCHED', label: 'Dispatched', icon: FaTruck },
        { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: FaShippingFast },
        { key: 'DELIVERED', label: 'Delivered', icon: FaHome }
    ];

    const cancelledSteps = [
        { key: 'CANCELLED', label: 'Cancelled', icon: FaTimesCircle },
        { key: 'REFUND_INITIATED', label: 'Refund Initiated', icon: FaMoneyBillWave },
        { key: 'REFUND_COMPLETED', label: 'Refund Completed', icon: FaCheckCircle }
    ];

    // Determine which flow to show
    const isCancelled = orderStatus === 'CANCELLED' || orderStatus === 'REFUND_INITIATED' || orderStatus === 'REFUND_COMPLETED';
    const steps = isCancelled ? cancelledSteps : normalSteps;

    // Map status to step index
    const statusOrder = {
        'PENDING': 0,
        'CONFIRMED': 0,
        'PACKED': 1,
        'DISPATCHED': 2,
        'OUT_FOR_DELIVERY': 3,
        'DELIVERED': 4,
        'CANCELLED': 0,
        'REFUND_INITIATED': 1,
        'REFUND_COMPLETED': 2
    };

    const currentStepIndex = statusOrder[orderStatus] ?? 0;

    const getStepStatus = (index) => {
        if (index < currentStepIndex) return 'completed';
        if (index === currentStepIndex) return 'current';
        return 'pending';
    };

    const getStepColor = (status) => {
        if (isCancelled) {
            switch (status) {
                case 'completed': return 'bg-red-600 text-white border-red-600';
                case 'current': return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 animate-pulse';
                case 'pending': return 'bg-gray-200 text-gray-400 border-gray-300';
                default: return 'bg-gray-200 text-gray-400 border-gray-300';
            }
        } else {
            switch (status) {
                case 'completed': return 'bg-green-600 text-white border-green-600';
                case 'current': return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 animate-pulse';
                case 'pending': return 'bg-gray-200 text-gray-400 border-gray-300';
                default: return 'bg-gray-200 text-gray-400 border-gray-300';
            }
        }
    };

    const getLineColor = (status) => {
        if (isCancelled) {
            return status === 'completed' ? 'bg-red-600' : 'bg-gray-300';
        } else {
            return status === 'completed' ? 'bg-green-600' : 'bg-gray-300';
        }
    };

    return (
        <div className="w-full py-6">
            {/* Mobile View - Vertical Stepper */}
            <div className="md:hidden space-y-4">
                {steps.map((step, index) => {
                    const stepStatus = getStepStatus(index);
                    const Icon = step.icon;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.key} className="relative flex items-start">
                            {/* Icon Circle */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStepColor(stepStatus)} transition-all duration-300`}>
                                <Icon className="text-xl" />
                            </div>

                            {/* Connecting Line */}
                            {!isLast && (
                                <div className={`absolute left-6 top-12 w-0.5 h-8 ${getLineColor(stepStatus)} transition-all duration-300`}></div>
                            )}

                            {/* Label */}
                            <div className="ml-4 flex-1">
                                <p className={`font-semibold ${stepStatus === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {step.label}
                                </p>
                                {stepStatus === 'current' && (
                                    <p className="text-sm text-red-600 font-medium mt-1">Current Status</p>
                                )}
                                {stepStatus === 'completed' && (
                                    <p className={`text-sm ${isCancelled ? 'text-red-600' : 'text-green-600'} font-medium mt-1`}>Completed</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View - Horizontal Stepper */}
            <div className="hidden md:block">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const stepStatus = getStepStatus(index);
                        const Icon = step.icon;
                        const isLast = index === steps.length - 1;

                        return (
                            <React.Fragment key={step.key}>
                                {/* Step */}
                                <div className="flex flex-col items-center flex-1">
                                    {/* Icon Circle */}
                                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${getStepColor(stepStatus)} transition-all duration-300 shadow-lg`}>
                                        <Icon className="text-2xl" />
                                    </div>

                                    {/* Label */}
                                    <div className="mt-3 text-center">
                                        <p className={`font-semibold text-sm ${stepStatus === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                                            {step.label}
                                        </p>
                                        {stepStatus === 'current' && (
                                            <p className="text-xs text-red-600 font-medium mt-1">Current Status</p>
                                        )}
                                        {stepStatus === 'completed' && (
                                            <p className={`text-xs ${isCancelled ? 'text-red-600' : 'text-green-600'} font-medium mt-1`}>✓ Completed</p>
                                        )}
                                    </div>
                                </div>

                                {/* Connecting Line */}
                                {!isLast && (
                                    <div className="flex-1 h-1 mx-2 -mt-8">
                                        <div className={`h-full ${getLineColor(stepStatus)} transition-all duration-300 rounded`}></div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Status Message */}
            <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Order Status</p>
                        <p className={`text-lg font-bold ${isCancelled ? 'text-red-600' : 'text-red-600'}`}>
                            {orderStatus.replace(/_/g, ' ')}
                        </p>
                    </div>
                    {deliveredAt && (
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Delivered On</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {new Date(deliveredAt).toLocaleDateString('en-IN', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    )}
                    {cancelledAt && (
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Cancelled On</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {new Date(cancelledAt).toLocaleDateString('en-IN', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderProgressStepper;

