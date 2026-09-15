const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  table_id: { type: String, required: true },
  guest_name: { type: String, default: 'Guest' },
  rating: { type: Number, required: true },
  comment: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
