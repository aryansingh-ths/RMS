const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  mac: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Online', 'Offline', 'Standby'], default: 'Offline' }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
