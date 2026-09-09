const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  guest_name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  total_visits: { type: Number, default: 1 },
  last_visit: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
