const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  table_id: { type: String, required: true, unique: true }, // e.g. "T1", "T-Bar-01"
  label:    { type: String, required: true },               // display label
  zone:     { type: String, default: 'Main Hall' },
  capacity: { type: Number, default: 4 },
  is_active:{ type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
