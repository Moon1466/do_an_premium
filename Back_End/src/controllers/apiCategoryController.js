const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
const Category = require('../model/Categories'); // Đảm bảo đường dẫn đúng

const createCategory = async (req, res) => {
  try {
    const { name, parent, description } = req.body;

    // Kiểm tra xem parent có tồn tại không nếu được cung cấp
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
      }
    }

    const newCategory = new Category({ 
      name, 
      parent: parent || null,
      description
    });
    
    await newCategory.save();

    // Nếu có parent, cập nhật subCategories cho cha
    if (parent) {
      await Category.findByIdAndUpdate(
        parent,
        { $push: { subCategories: newCategory._id } }
      );
    }

    res.status(201).json({ message: 'Thêm danh mục thành công', category: newCategory });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi khi thêm danh mục', error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    // Chỉ lấy các danh mục gốc (không có parent)
    const categories = await Category.find({ parent: null }).lean();

    // Tính số lượng danh mục con cho mỗi danh mục gốc
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const subCategoriesCount = await Category.countDocuments({ parent: cat._id });
        return {
          ...cat,
          subCategoriesCount
        };
      })
    );

    res.render("category", { categories: categoriesWithCounts });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Internal Server Error");
  }
};

const getCategoriesbySlugPath = async (req, res, next) => {
  const { slugPath } = req.params;

  if (!slugPath) {
    return res.status(400).json({ error: 'SlugPath is required' });
  }

  try {
    // Nếu slugPath là ObjectId hợp lệ, tìm theo ID
    if (mongoose.Types.ObjectId.isValid(slugPath)) {
      const category = await Category.findById(slugPath).populate('parent').lean();
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.json(category);
    }

    // Nếu slugPath không phải ObjectId, tìm theo fullSlug
    const category = await Category.findOne({ fullSlug: slugPath });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const getCategoryById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const category = await Category.findById(id).populate('parent').lean();
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    const subCategories = await Category.find({ parent: id }).lean();
   

    category.subCategories = subCategories || [];
    res.status(200).json(category);
  } catch (err) {
    console.error("Error fetching category details:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updatedCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parent } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Lấy thông tin cũ
    const oldCategory = await Category.findById(id);
    if (!oldCategory) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    // Tính lại slug nếu đổi tên
    let slug = oldCategory.slug;
    if (name && name !== oldCategory.name) {
      slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    }

    // Xác định parent mới (nếu đổi), hoặc giữ nguyên parent cũ
    let parentId = typeof parent !== "undefined" ? parent : oldCategory.parent;

    // Tính lại fullSlug
    let fullSlug = slug;
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (parentCategory) {
        fullSlug = `${parentCategory.fullSlug}/${slug}`;
      }
    }

    // Cập nhật danh mục
    const updatedData = { name, slug, fullSlug, parent: parentId || null };
    const category = await Category.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    // Nếu đổi tên hoặc đổi cha, cập nhật fullSlug cho các danh mục con
    if ((name && name !== oldCategory.name) || (typeof parent !== "undefined" && parent !== String(oldCategory.parent))) {
      const subCategories = await Category.find({ parent: id });
      for (const subCategory of subCategories) {
        const newFullSlug = `${fullSlug}/${subCategory.slug}`;
        await Category.findByIdAndUpdate(subCategory._id, { fullSlug: newFullSlug });
      }
    }

    res.status(200).json(category);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

 
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("ID không hợp lệ:", id);
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Tìm và xóa tất cả danh mục con liên quan
    const subCategories = await Category.find({ parent: id }).lean();
 
    if (subCategories.length > 0) {
      const subCategoryIds = subCategories.map((subCat) => subCat._id);
      await Category.deleteMany({ _id: { $in: subCategoryIds } });
     }

    // Xóa danh mục cha
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      console.error("Danh mục không tồn tại:", id);
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

     res.status(200).json({ message: "Danh mục và các danh mục con đã được xóa thành công" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const newCategory = async (req, res) => {
  try {
    const allCats = await Category.find().sort('fullSlug');
    // Luôn truyền error—khi không có lỗi thì null
    res.render('newCategory', { allCats, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

const showCategory = async (req, res) => {
    try {
      const slugPath = req.params.slugPath;
  
      // Tìm danh mục hiện tại
      const cat = await Category.findOne({ fullSlug: slugPath });
      if (!cat) {
        return res.status(404).send('Category not found');
      }
  
      // Tìm các danh mục con
      const subCategories = await Category.find({ parent: cat._id }).sort('name');
  
      // Render giao diện với danh mục hiện tại và danh mục con
      res.render('categoryDetail', { category: cat, subCategories });
    } catch (err) {
      console.error('Error fetching category:', err);
      res.status(500).send('Internal Server Error');
    }
  }


const getRootCategories = async (req, res) => {
    try {
      const categories = await Category.find({ parent: null }).lean();
  
      const categoriesWithSubCount = await Promise.all(
        categories.map(async (cat) => {
          const subCategoriesCount = await Category.countDocuments({ parent: cat._id });
          return { ...cat, subCategoriesCount };
        })
      );
  
      res.status(200).json(categoriesWithSubCount);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).send("Internal Server Error");
    }
  };
  
// API trả về JSON cho FE
const getCategoriesAPI = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createCategory , getCategories , getCategoriesbySlugPath , getCategoryById , updatedCategory , deleteCategory, newCategory, showCategory, getRootCategories, getCategoriesAPI
};