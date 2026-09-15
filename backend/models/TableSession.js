const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema({
  // Simple string like "T1", "T2" — no Device model dependency
  device_id: { type: String, required: true },
  guest_name: { type: String },
  email: { type: String },
  auth_code: { type: String },
  mobile: { type: String },
  party_size: { type: Number, default: 1 },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  status: { type: String, enum: ['standby', 'active', 'completed'], default: 'standby' },
  order_type: { type: String, enum: ['dine_in', 'takeaway'], default: 'dine_in' }
}, { timestamps: true });

// A table can only have one active session at a time
tableSessionSchema.index({ device_id: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

module.exports = mongoose.model('TableSession', tableSessionSchema);
