const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  street: {
    type: String,
    required: [true, "Street address is required"],
    trim: true
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true
  },
  zipCode: {
    type: String,
    required: [true, "Zip code is required"],
    trim: true
  },
  country: {
    type: String,
    default: "Pakistan"
  }
}, {
  timestamps: true
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;