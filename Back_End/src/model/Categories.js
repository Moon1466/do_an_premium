// models/Category.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  fullSlug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Ví dụ: 'sach-giao-khoa/sach-giao-khoa-cap-1/san-pham'
  },
  description: {
    type: String,
    trim: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
}, {
  timestamps: true,
});

// Trước khi lưu, tạo slug và fullSlug
categorySchema.pre('validate', async function(next) {
  // 1. Tạo slug từ name
  this.slug = slugify(this.name, { lower: true, strict: true });

  // 2. Nếu có parent, lấy parent.fullSlug
  if (this.parent) {
    const parentCat = await this.constructor.findById(this.parent);
    if (!parentCat) {
      return next(new Error('Parent category not found'));
    }
    this.fullSlug = `${parentCat.fullSlug}/${this.slug}`;
  } else {
    // root-level
    this.fullSlug = this.slug;
  }

  next();
});

module.exports = mongoose.model('Category', categorySchema);
