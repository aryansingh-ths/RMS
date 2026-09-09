const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  ingredient_name: { type: String, required: true, unique: true },
  stock_level: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  par_level: { type: Number, required: true, default: 10 },
  vendor_name: { type: String, required: true, default: 'Unknown Vendor' },
  cost_per_unit: { type: Number, required: true, default: 1.00 },
  on_order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
