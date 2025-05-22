const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: {
    type: [String],
    validate: [arr => arr.length > 0, 'Trường hình ảnh là bắt buộc']
  },
  subImages: {
    type: [String],
    default: [] // Mặc định là mảng rỗng
  },
  price: { type: Number, required: true, min: [1, 'Giá phải lớn hơn 0'] },
  stock: { type: Number, required: true, min: [1, 'Tồn kho phải lớn hơn 0'] },
  supplier: { type: String },
  publisher: { type: String },
  type: { type: String },
  author: { type: String },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  active: { type: Boolean, default: true },
  isSale: { type: Boolean, default: false },
  sale: {
    type: Number,
    min: [1, 'Sale phải từ 1'],
    max: [100, 'Sale tối đa là 100'],
    validate: {
      validator: function(value) {
        // Nếu isSale là true thì sale phải có giá trị (không null, không undefined)
        if (this.isSale) {
          return value !== undefined && value !== null;
        }
        // Nếu isSale là false thì sale có thể không có
        return true;
      },
      message: 'Trường sale là bắt buộc khi isSale là true'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);