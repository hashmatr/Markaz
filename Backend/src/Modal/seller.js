const mongoose = require('mongoose');
const userRoles = require('../domain/userRole');
const AccountStatus = require('../domain/AccountStatus');

const sellerSchema = new mongoose.Schema({
  // --- Personal & Contact Details ---
  fullName: {
    type: String,
    required: [true, 'Seller full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\d{10}$/, 'Please provide a valid 10-digit mobile number']
  },

  password: {
    type:string,
    required:true,
    select:false
  },

  pickupAddress: {
    type: String,
    ref: 'Address',
  },

  // --- Store & Brand Details ---
  storeInfo: {
    storeName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    storeDescription: String,
    storeLogo: String, // URL to image
    officialWebsite: String
  },

  // --- Business & GST Details ---
  businessDetails: {
    registeredAddress: {
      flatNo: String,
      area: String,
      city: String,
      state: String,
      pincode: { type: String, required: true }
    },
    gstNumber: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format']
    },
    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
    }
  },

  // --- Bank Details (For Payouts) ---
  bankDetails: {
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code']
    },
    bankName: { type: String, required: true },
    accountStatus: {
      type: String,
      enum: [AccountStatus.PENDING, AccountStatus.UNDER_REVIEW, AccountStatus.ACTIVE, AccountStatus.SUSPENDED, AccountStatus.REJECTED],
      default: AccountStatus.PENDING
    }
  },

  // --- Admin Control ---
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'pending'
  },
  commissionRate: {
    type: Number,
    default: 10 // Default 10% commission charged by the marketplace
  }
}, 

    { 
     timestamps: true, // Automatically creates createdAt and updatedAt fields
    role:{
    type:String,
    enum:[userRoles.Seller],
    default:userRoles.Seller
  }
    });

const Seller = mongoose.model('Seller', sellerSchema);
module.exports = Seller;