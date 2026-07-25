import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    },
    orderId : {
        type : String,
        required : [true, "Provide orderId"],
        unique : true
    },
    productId : {
        type : mongoose.Schema.ObjectId,
        ref : "product"
    },
    product_details : {
        name : String,
        image : Array,
    },
    paymentId : {
        type : String,
        default : ""
    },
    payment_status : {
        type : String,
        default : ""
    },
    payment_method : {
        type : String,
        enum : ['cod', 'online', 'partial_prepayment'],
        default : 'cod'
    },
    // Partial Prepayment fields (for fraud prevention)
    prepayment_amount : {
        type : Number,
        default : 0
    },
    cod_amount : {
        type : Number,
        default : 0
    },
    prepayment_status : {
        type : String,
        enum : ['none', 'pending', 'completed', 'failed'],
        default : 'none'
    },
    prepayment_transaction_id : {
        type : String,
        default : ""
    },
    delivery_address : {
        type : mongoose.Schema.ObjectId,
        ref : 'address'
    },
    subTotalAmt : {
        type : Number,
        default : 0
    },
    totalAmt : {
        type : Number,
        default : 0
    },
    invoice_receipt : {
        type : String,
        default : ""
    },
    // Order status tracking
    order_status : {
        type : String,
        enum : ['PENDING', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_INITIATED', 'REFUND_COMPLETED'],
        default : 'PENDING'
    },
    // Delivery tracking information
    delivery_partner : {
        agentId : {
            type : mongoose.Schema.ObjectId,
            ref : 'User',
            default : null
        },
        name : {
            type : String,
            default : ""
        },
        phone : {
            type : String,
            default : ""
        },
        vehicle_number : {
            type : String,
            default : ""
        },
        assignedAt : {
            type : Date,
            default : null
        },
        acceptedAt : {
            type : Date,
            default : null
        }
    },
    // Agent real-time location
    agent_location : {
        lat : {
            type : Number,
            default : null
        },
        lng : {
            type : Number,
            default : null
        },
        updated_at : {
            type : Date,
            default : null
        },
        accuracy : {
            type : Number,
            default : null
        }
    },
    // ETA information
    estimated_delivery_time : {
        type : Date,
        default : null
    },
    distance_to_customer : {
        type : Number, // in kilometers
        default : null
    },
    tracking_url : {
        type : String,
        default : ""
    },
    // Delivery slot information
    delivery_slot : {
        type : String,
        required : [true, "Please select a delivery slot"],
        enum : ['7am-8am', '10am-11am', '1pm-2pm', '4pm-5pm', '7pm-8pm', '10pm-11pm']
    },
    delivery_date : {
        type : Date,
        required : [true, "Delivery date is required"]
    },
    // Cancellation/Refund information
    cancellation_reason : {
        type : String,
        default : ""
    },
    cancelled_at : {
        type : Date
    },
    refund_id : {
        type : String,
        default : ""
    },
    refund_amount : {
        type : Number,
        default : 0
    },
    refund_status : {
        type : String,
        enum : ['NONE', 'INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED'],
        default : 'NONE'
    },
    refund_initiated_at : {
        type : Date
    },
    refund_completed_at : {
        type : Date
    },
    // Delivery timestamp
    delivered_at : {
        type : Date
    },
    dispatched_at : {
        type : Date
    },
    out_for_delivery_at : {
        type : Date
    },
    // OTP Verification for Delivery
    otp_code : {
        type : String,
        default : null
    },
    otp_expires_at : {
        type : Date,
        default : null
    },
    otp_attempts : {
        type : Number,
        default : 0
    },
    otp_verified_at : {
        type : Date,
        default : null
    },
    // Proof of Delivery
    proof : {
        type : {
            type : String,
            enum : ['photo', 'signature', 'both'],
            default : null
        },
        photoUrl : {
            type : String,
            default : ""
        },
        signatureUrl : {
            type : String,
            default : ""
        },
        captured_at : {
            type : Date,
            default : null
        },
        capturedBy : {
            type : mongoose.Schema.ObjectId,
            ref : 'User',
            default : null
        }
    },
    // COD Collection
    cod_collected : {
        type : Boolean,
        default : false
    },
    cod_collected_at : {
        type : Date,
        default : null
    },
    collected_by : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        default : null
    },
    // Customer Rating for Agent
    agent_rating : {
        stars : {
            type : Number,
            min : 1,
            max : 5,
            default : null
        },
        comment : {
            type : String,
            default : ""
        },
        created_at : {
            type : Date,
            default : null
        }
    },
    // Delivery Failure Tracking
    delivery_attempts : {
        type : Number,
        default : 0
    },
    failure_reason : {
        type : String,
        enum : ['CUSTOMER_UNAVAILABLE', 'INCORRECT_ADDRESS', 'REFUSED_DELIVERY', 'COD_REJECTED', 'OTHER'],
        default : null
    },
    failure_notes : {
        type : String,
        default : ""
    },
    // Agent Earnings for this Order
    agent_earning : {
        baseAmount : {
            type : Number,
            default : 0
        },
        distanceBonus : {
            type : Number,
            default : 0
        },
        tipAmount : {
            type : Number,
            default : 0
        },
        totalEarning : {
            type : Number,
            default : 0
        },
        status : {
            type : String,
            enum : ['PENDING', 'APPROVED', 'PAID'],
            default : 'PENDING'
        }
    }
},{
    timestamps : true
})

const OrderModel = mongoose.model('order',orderSchema)

export default OrderModel