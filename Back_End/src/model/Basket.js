const mongoose = require('mongoose');

const basketItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
});

const basketSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  items: [basketItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Basket', basketSchema);
