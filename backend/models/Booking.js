const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  table_id: { type: String, required: true },
  guest_name: { type: String, required: true },
  email: { type: String },
  auth_code: { type: String },
  mobile: { type: String },
  party_size: { type: Number, default: 1 },
  booking_time: { type: Date, required: true },
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  status: { type: String, enum: ['pending', 'ready', 'active', 'cancelled', 'completed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
