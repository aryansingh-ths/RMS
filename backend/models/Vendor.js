const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  contact_email: { type: String, default: '' },
  phone: { type: String, default: '' },
  edi_connected: { type: Boolean, default: false },
  vetted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
