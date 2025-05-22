const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock, supplier, publisher, type, author, description, category } = req.body;
    // Xử lý file ảnh nếu có (req.files)
    const images = []; // Xử lý thêm nếu dùng upload ảnh
    const subImages = [];
    const product = new Product({
      name, price, stock, supplier, publisher, type, author, description, category, images, subImages
    });
    await product.save();
    res.status(201).json({ message: 'Thêm sản phẩm thành công', product });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm', error: err.message });
  }
};