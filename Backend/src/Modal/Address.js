const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  // --- Building Details ---
  houseNumber: { 
    type: String, 
    required: [true, "House/Flat/Office number is required"],
    trim: true 
  },
  floor: { 
    type: String, 
    trim: true 
  },
  buildingName: { 
    type: String, 
    trim: true 
  },

  // --- Locality Details ---
  streetAddress: { 
    type: String, 
    required: [true, "Street name or area is required"],
    trim: true 
  },
  landmark: { 
    type: String, 
    trim: true,
    placeholder: "e.g. Near Apollo Hospital"
  },

  // --- Region Details ---
  city: { 
    type: String, 
    required: [true, "City is required"],
    trim: true 
  },
  district: { 
    type: String, 
    trim: true 
  },
  state: { 
    type: String, 
    required: [true, "State is required"],
    trim: true 
  },
  pincode: { 
    type: String, 
    required: [true, "Pincode is required"],
    match: [/^\d{6}$/, "Please provide a valid 6-digit pincode"]
  },
  country: { 
    type: String, 
    default: "India" 
  },

  // --- Coordinates (For Logistics/Maps) ---
  coordinates: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  }
}, { 
  _id: false, // Prevents generating a sub-ID if used inside another schema
  timestamps: true 
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;