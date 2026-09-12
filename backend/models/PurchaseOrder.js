const mongoose = require('mongoose');

const poSchema = new mongoose.Schema({
  vendor_name: { type: String, required: true },
  items: [{
    inventory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    ingredient_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    cost_per_unit: { type: Number, required: true }
  }],
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'dispatched', 'received', 'cancelled'], default: 'pending' },
  dispatchedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', poSchema);
