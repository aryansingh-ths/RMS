const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', required: false },
  device_id: { type: String, required: true }, // e.g. T1
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'preparing', 'completed', 'paid', 'cancelled'], default: 'preparing' },
  payment_method: { type: String, enum: ['upi', 'card', 'cash'], required: false },
  completedAt: { type: Date, required: false },
  order_type: { type: String, enum: ['dine_in', 'takeaway'], default: 'dine_in' },
  taxes: [{
    label: String,
    amount: Number
  }],
  items: [{
    id: String,
    menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    mods: [String],
    note: String,
    category: String,
    price: Number
  }],
  station: { type: String, default: 'Grill' },
  course: { type: String, default: 'main' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

