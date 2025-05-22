console.log('apiProductController.js loaded');
console.log('api.js loaded');
console.log('Registering /products/by-category route');

const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../model/Products');
const Category = require('../model/Categories'); 

const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/dcqyuixqu/image/upload/';

function getCloudinaryUrl(img) {
  if (!img) return '';
  return img.startsWith('http') ? img : CLOUDINARY_PREFIX + img;
}

const createProduct = async (req, res) => {
  try {
    const { name, price, stock, supplier, publisher, type, author, description, category } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !price || !stock || !category) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    // Kiểm tra giá và số lượng hợp lệ
    if (price <= 0 || stock < 0) {
      return res.status(400).json({ message: 'Giá và số lượng phải lớn hơn 0' });
    }

    // Kiểm tra sản phẩm đã tồn tại chưa
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ message: 'Sản phẩm đã tồn tại' });
    }

    // Kiểm tra category có tồn tại không
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Danh mục không tồn tại' });
    }

    // Xử lý upload ảnh
    let images = [];
    let subImages = [];
    
    if (req.files) {
      if (req.files.mainImage) {
        images = [req.files.mainImage[0].path];
      }
      if (req.files.subImages) {
        subImages = req.files.subImages.map(file => file.path);
      }
    }

    const product = new Product({
      name,
      price,
      stock,
      supplier,
      publisher,
      type,
      author,
      description,
      category,
      images,
      subImages
    });

    await product.save();
    res.status(201).json({ message: 'Thêm sản phẩm thành công', product });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm', error: err.message });
  }
};

const addProduct = async (req, res) => {
  try {
    // Lấy tên file đã được multer đổi (không dấu, an toàn)
    let images = [];
    let subImages = [];
    if (req.files && req.files['images']) {
      images = req.files['images'].map(file => file.path);
    }
    if (req.files && req.files['subImages']) {
      subImages = req.files['subImages'].map(file => file.path);
    }

    // Tạo sản phẩm mới
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      stock: req.body.stock,
      images: images,           // Đúng tên file đã đổi
      subImages: subImages,     // Đúng tên file đã đổi
      supplier: req.body.supplier,
      publisher: req.body.publisher,
      type: req.body.type,
      author: req.body.author,
      category: req.body.category,
      parentCategory: req.body.parentCategory,
      description: req.body.description,
      isSale: req.body.isSale === 'true',
      sale: req.body.sale,
      active: req.body.active === 'true'
    });

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    let query = {};

    // Tìm kiếm theo tên
    if (req.query.search) {
      query.name = { $regex: new RegExp(req.query.search, 'i') };
    }

    // Lọc theo danh mục (bao gồm cả danh mục con)
    if (req.query.categories) {
      const categoryIds = req.query.categories.split(',');
      let allCategoryIds = [...categoryIds];
      // Lấy thêm các danh mục con cho mỗi danh mục cha
      for (const catId of categoryIds) {
        const subCats = await Category.find({ parent: catId }).select('_id');
        subCats.forEach(sub => allCategoryIds.push(String(sub._id)));
      }
      query.category = { $in: allCategoryIds };
    }

    // Lọc theo giá
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice && req.query.maxPrice !== 'Infinity') {
      query.price = { ...query.price, $lte: Number(req.query.maxPrice) };
    }

    const products = await Product.find(query).populate({
      path: 'category',
      populate: { path: 'parent' }
    });

    // Lấy tất cả categories và phân loại
    const allCategories = await Category.find();
    const parentCategories = allCategories.filter(cat => !cat.parent);
    const childCategories = allCategories.filter(cat => cat.parent);

    // Chuyển đổi URL cho từng sản phẩm
    const productsWithImageUrl = products.map(product => ({
      ...product.toObject(),
      images: product.images.map(getCloudinaryUrl),
      subImages: product.subImages.map(getCloudinaryUrl),
    }));

    // Nếu là API route /products, trả về JSON
    res.json({
      success: true,
      data: productsWithImageUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sản phẩm'
    });
  }
};

const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        // Populate category và parent (1 cấp)
        const product = await Product.findById(productId)
            .populate({
                path: 'category',
                populate: {
                    path: 'parent'
                }
            });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Lấy breadcrumbs category (nhiều cấp)
        let breadcrumbs = [];
        let current = product.category;
        while (current) {
            breadcrumbs.unshift({
                name: current.name,
                slug: current.slug,
                _id: current._id
            });
            current = current.parent;
        }

        // Chuyển đổi URL cho sản phẩm
        const productWithImageUrl = {
          ...product.toObject(),
          images: product.images.map(getCloudinaryUrl),
          subImages: product.subImages.map(getCloudinaryUrl),
        };

        res.json({
            success: true,
            data: productWithImageUrl,
            categoryBreadcrumbs: breadcrumbs // Thêm mảng breadcrumbs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin sản phẩm'
        });
    }
};

const updateProductStatus = async (req, res) => {
  try {
      const { id } = req.params;
      const { active } = req.body;

      // Kiểm tra tồn kho trước khi cập nhật
      const product = await Product.findById(id);
      if (!product) {
          return res.status(404).json({
              success: false,
              message: 'Không tìm thấy sản phẩm'
          });
      }

      // Nếu tồn kho = 0, không cho phép active
      if (product.stock === 0 && active === true) {
          return res.status(400).json({
              success: false,
              message: 'Không thể kích hoạt sản phẩm khi hết hàng'
          });
      }

      // Cập nhật trạng thái
      const updatedProduct = await Product.findByIdAndUpdate(
          id,
          { active: active },
          { new: true }
      );

      res.json({
          success: true,
          message: 'Cập nhật trạng thái thành công',
          data: updatedProduct
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Lỗi server khi cập nhật trạng thái'
      });
  }
}

const deleteProduct =  async (req, res) => {
  try {
      const { id } = req.params;

      // Kiểm tra sản phẩm tồn tại
      const product = await Product.findById(id);
      if (!product) {
          return res.status(404).json({
              success: false,
              message: 'Không tìm thấy sản phẩm'
          });
      }

      // Xóa sản phẩm
      await Product.findByIdAndDelete(id);

      res.json({
          success: true,
          message: 'Xóa sản phẩm thành công'
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Lỗi server khi xóa sản phẩm'
      });
  }
}

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = { ...req.body };
    
    // Chuyển đổi các trường dữ liệu
    updateData.price = Number(updateData.price);
    updateData.stock = Number(updateData.stock);
    updateData.isSale = updateData.isSale === 'true';
    updateData.active = updateData.active === 'true';
    if (updateData.sale) {
      updateData.sale = Number(updateData.sale);
    }
    
    // Xử lý ảnh chính và ảnh phụ
    if (req.files) {
      // Nếu có ảnh chính mới, cập nhật ảnh chính
      if (req.files['images'] && req.files['images'].length > 0) {
        updateData.images = req.files['images'].map(file => file.path);
      }
      
      // Nếu có ảnh phụ mới, thêm vào mảng ảnh phụ hiện có
      if (req.files['subImages'] && req.files['subImages'].length > 0) {
        // Lấy sản phẩm hiện tại để có danh sách ảnh phụ
        const currentProduct = await Product.findById(productId);
        const currentSubImages = currentProduct.subImages || [];
        
        // Thêm ảnh mới vào mảng hiện có
        const newSubImages = req.files['subImages'].map(file => file.path);
        updateData.subImages = [...currentSubImages, ...newSubImages];
      }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm',
      error: error.message
    });
  }
}

const deleteSubImage = async (req, res) => {
  try {
    const { id, index } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    const indexNumber = parseInt(index);
    if (isNaN(indexNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Index không hợp lệ'
      });
    }

    // Tìm sản phẩm
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Kiểm tra mảng subImages có tồn tại và có phần tử không
    if (!product.subImages || !Array.isArray(product.subImages)) {
      product.subImages = []; // Khởi tạo mảng rỗng nếu chưa có
    }

    // Kiểm tra index hợp lệ
    if (indexNumber < 0 || indexNumber >= product.subImages.length) {
      return res.status(400).json({
        success: false,
        message: 'Index ảnh không hợp lệ'
      });
    }

    // Lấy tên file ảnh cần xóa
    const imageToDelete = product.subImages[indexNumber];

    // Xóa ảnh khỏi mảng subImages
    product.subImages.splice(indexNumber, 1);

    // Lưu thay đổi vào database với validateBeforeSave: false để bỏ qua validation
    await product.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Xóa ảnh thành công',
      deletedImage: imageToDelete
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa ảnh',
      error: error.message
    });
  }
};

const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Tìm sản phẩm theo slug và populate thông tin category
        const product = await Product.findOne({ slug })
            .populate({
                path: 'category',
                populate: {
                    path: 'parent'
                }
            });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Chuyển đổi URL cho sản phẩm
        const productWithImageUrl = {
            ...product.toObject(),
            images: product.images.map(getCloudinaryUrl),
            subImages: product.subImages.map(getCloudinaryUrl),
        };

        res.json({
            success: true,
            data: productWithImageUrl
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin sản phẩm',
            error: error.message
        });
    }
};

// Hàm đệ quy lấy tất cả ID danh mục con
async function getAllSubcategoryIds(categoryId) {
  try {
    console.log('getAllSubcategoryIds CALLED with:', categoryId);
    const directSubcategories = await Category.find({ parent: categoryId }).select('_id').lean();
    const directSubcategoryIds = directSubcategories.map(cat => cat._id);
    console.log('  directSubcategoryIds:', directSubcategoryIds);
    let nestedIds = [];
    for (const subId of directSubcategoryIds) {
      const childIds = await getAllSubcategoryIds(subId);
      nestedIds.push(...childIds);
    }
    const allIds = [...directSubcategoryIds, ...nestedIds];
    console.log('  allIds for category', categoryId, ':', allIds);
    return allIds;
  } catch (err) {
    console.error('Lỗi trong getAllSubcategoryIds:', err);
    return [];
  }
}

// API: Lấy sản phẩm theo categoryId (bao gồm cả danh mục con)
const getProductsByCategory = async (req, res) => {
  console.log('getProductsByCategory CALLED');
  try {
    const { category } = req.query;
    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: 'Thiếu hoặc sai categoryId' });
    }
    // Lấy tất cả ID danh mục con
    const allSubCategoryIds = await getAllSubcategoryIds(category);
    const categoryIds = [category, ...allSubCategoryIds];
    console.log('API getProductsByCategory:');
    console.log('  categoryId:', category);
    console.log('  allSubCategoryIds:', allSubCategoryIds);
    console.log('  categoryIds for query:', categoryIds);
    // Lấy sản phẩm thuộc các danh mục này
    const products = await Product.find({ category: { $in: categoryIds } });
    console.log('  products found:', products.length);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Lỗi trong getProductsByCategory:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createProduct, addProduct, getAllProducts, getProductById, updateProductStatus, deleteProduct, updateProduct, deleteSubImage, getProductBySlug,
  getProductsByCategory
};