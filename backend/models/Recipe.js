const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, unique: true },
  ingredients: [{
    inventory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity_required: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
