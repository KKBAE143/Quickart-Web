import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Provide name"],
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allow multiple null/undefined emails
      default: null,
    },
    password: {
      type: String,
      required: [true, "provide password"],
    },
    avatar: {
      type: String,
      default: "",
    },
    mobile: {
      type: String,
      required: [true, "provide mobile"],
      unique: true,
    },
    is_mobile_verified: {
      type: Boolean,
      default: false,
    },
    mobile_otp: {
      type: String,
      default: null,
    },
    mobile_otp_expiry: {
      type: Date,
      default: "",
    },
    mobile_otp_attempts: {
      type: Number,
      default: 0,
    },
    refresh_token: {
      type: String,
      default: "",
    },
    verify_email: {
      type: Boolean,
      default: false,
    },
    last_login_date: {
      type: Date,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    address_details: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "address",
      },
    ],
    shopping_cart: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "cartProduct",
      },
    ],
    orderHistory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "order",
      },
    ],
    forgot_password_otp: {
      type: String,
      default: null,
    },
    forgot_password_expiry: {
      type: Date,
      default: "",
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER", "DELIVERY_AGENT"],
      default: "USER",
    },
    // Delivery Agent Profile
    agentProfile: {
      vehicle: {
        type: {
          type: String,
          enum: ["BIKE", "SCOOTER", "BICYCLE", "CAR", "VAN"],
          default: null,
        },
        number: {
          type: String,
          default: "",
        },
        model: {
          type: String,
          default: "",
        },
      },
      documents: {
        idType: {
          type: String,
          enum: ["AADHAAR", "PAN", "DRIVING_LICENSE", "VOTER_ID"],
          default: null,
        },
        idNumber: {
          type: String,
          default: "",
        },
        idImageUrl: {
          type: String,
          default: "",
        },
        idDocumentImage: {
          type: String,
          default: "",
        },
        selfieImage: {
          type: String,
          default: "",
        },
        verificationStatus: {
          type: String,
          enum: ["PENDING", "VERIFIED", "REJECTED"],
          default: "PENDING",
        },
        submittedAt: {
          type: Date,
          default: null,
        },
        verifiedAt: {
          type: Date,
          default: null,
        },
        rejectionReason: {
          type: String,
          default: "",
        },
        rejectedAt: {
          type: Date,
          default: null,
        },
        vehicleRC: {
          type: String,
          default: "",
        },
        drivingLicense: {
          type: String,
          default: "",
        },
      },
      backgroundCheck: {
        status: {
          type: String,
          enum: ["PENDING", "IN_PROGRESS", "APPROVED", "VERIFIED", "REJECTED"],
          default: "PENDING",
        },
        reportUrl: {
          type: String,
          default: "",
        },
        verifiedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          default: null,
        },
        verifiedAt: {
          type: Date,
          default: null,
        },
        remarks: {
          type: String,
          default: "",
        },
      },
      trainingCompleted: {
        type: Boolean,
        default: false,
      },
      trainingCompletedAt: {
        type: Date,
        default: null,
      },
    },
    // Socket Connection Tracking
    socketId: {
      type: String,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    // Agent Operational Status
    agentStatus: {
      available: {
        type: Boolean,
        default: false,
      },
      current_location: {
        lat: {
          type: Number,
          default: null,
        },
        lng: {
          type: Number,
          default: null,
        },
        updatedAt: {
          type: Date,
          default: null,
        },
        accuracy: {
          type: Number,
          default: null,
        },
      },
      activeOrderId: {
        type: mongoose.Schema.ObjectId,
        ref: "order",
        default: null,
      },
      onlineAt: {
        type: Date,
        default: null,
      },
      offlineAt: {
        type: Date,
        default: null,
      },
    },
    // Agent Performance Metrics
    agentMetrics: {
      totalDeliveries: {
        type: Number,
        default: 0,
      },
      successfulDeliveries: {
        type: Number,
        default: 0,
      },
      failedDeliveries: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      pendingEarnings: {
        type: Number,
        default: 0,
      },
      withdrawnEarnings: {
        type: Number,
        default: 0,
      },
      onTimeDeliveryRate: {
        type: Number,
        default: 0,
      },
      totalDistanceCovered: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
