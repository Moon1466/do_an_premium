const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: [{ type: String }],
  subImages: [{ type: String }],
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  supplier: { type: String },
  publisher: { type: String },
  type: { type: String },
  author: { type: String },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // liên kết danh mục cha/con
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);