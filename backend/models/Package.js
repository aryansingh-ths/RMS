const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  pricing_type: { type: String, enum: ['free', 'per_person'], default: 'free' },
  price: { type: Number, default: 0 },
  menu_items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }]
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
