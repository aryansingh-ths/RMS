const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', required: false },
  device_id: { type: String, required: true }, // e.g. T1
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'preparing', 'completed', 'paid'], default: 'preparing' },
  items: [{
    id: String,
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    mods: [String],
    note: String,
    category: String
  }],
  station: { type: String, default: 'Grill' },
  course: { type: String, default: 'main' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

