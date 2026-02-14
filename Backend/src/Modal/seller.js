const mongoose = require('mongoose');
const userRoles = require('../domain/userRole');
const AccountStatus = require('../domain/AccountStatus');

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // --- Store & Brand Details ---
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    storeSlug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    storeDescription: {
      type: String,
      maxlength: [1000, 'Store description cannot exceed 1000 characters'],
    },
    storeLogo: {
      public_id: String,
      url: String,
    },
    storeBanner: {
      public_id: String,
      url: String,
    },
    officialWebsite: String,

    // --- Contact Details ---
    businessEmail: {
      type: String,
      required: [true, 'Business email is required'],
      lowercase: true,
      trim: true,
    },
    businessPhone: {
      type: String,
      required: [true, 'Business phone is required'],
      trim: true,
    },
    pickupAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },

    // --- Business & GST Details ---
    businessDetails: {
      registeredAddress: {
        flatNo: String,
        area: String,
        city: String,
        state: String,
        pincode: { type: String },
      },
      gstNumber: {
        type: String,
        uppercase: true,
      },
      panNumber: {
        type: String,
        uppercase: true,
      },
    },

    // --- Bank Details (For Payouts) ---
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: {
        type: String,
        uppercase: true,
      },
      bankName: String,
    },

    // --- Admin Control ---
    commissionRate: {
      type: Number,
      default: parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 10,
      min: 0,
      max: 100,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.PENDING,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalProducts: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for searching
sellerSchema.index({ storeName: 'text', storeDescription: 'text' });

module.exports = mongoose.model('Seller', sellerSchema);