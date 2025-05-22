const Category = require('../model/Categories');
const Product = require('../model/Products');

// Thiết lập ID danh mục cố định cho trang giá sách
// Trong thực tế, bạn có thể muốn lưu ID này trong cấu hình hoặc cơ sở dữ liệu
const BOOKSHELF_CATEGORY_SLUG = 'sach-english'; // Thay thế bằng slug của danh mục bạn muốn sử dụng

const getBookshelfPage = async (req, res) => {
  try {
    // Lấy tất cả danh mục gốc
    const rootCategories = await Category.find({ parent: null }).lean();
    
    // Tổng số sản phẩm trong hệ thống
    const totalProducts = await Product.countDocuments();
    
    // Tính tổng số danh mục con
    let totalSubCategories = 0;
    for (const category of rootCategories) {
      const subCount = await Category.countDocuments({ parent: category._id });
      totalSubCategories += subCount;
    }
    
    // Tính số danh mục trống (không có sản phẩm)
    let emptyCategories = 0;

    // Lấy tất cả danh mục để hiển thị trong dropdown
    const allAvailableCategories = await Category.find().lean();

    // Cho mỗi danh mục, tính số lượng danh mục con và số lượng sản phẩm
    const categoriesWithDetails = await Promise.all(
      rootCategories.map(async (category) => {
        // Đếm số lượng danh mục con trực tiếp
        const subCategoriesCount = await Category.countDocuments({ parent: category._id });
        
        // Lấy tất cả ID của danh mục và các danh mục con (để tính tổng sản phẩm)
        const allSubCategoryIds = await getAllSubcategoryIds(category._id);
        const categoryIds = [category._id, ...allSubCategoryIds];
        
        // Đếm số lượng sản phẩm thuộc danh mục này và các danh mục con
        const productCount = await Product.countDocuments({ category: { $in: categoryIds } });
        
        if (productCount === 0) {
          emptyCategories++;
        }
        
        return {
          ...category,
          subCategoriesCount,
          productCount
        };
      })
    );

    res.render('bookshelf', {
      categories: categoriesWithDetails,
      allAvailableCategories,
      totalProducts,
      totalSubCategories,
      emptyCategories
    });
  } catch (err) {
    console.error('Lỗi khi tải trang giá sách:', err);
    res.status(500).render('error', {
      message: 'Đã xảy ra lỗi khi tải trang giá sách'
    });
  }
};

// Hàm đệ quy để lấy tất cả ID của danh mục con
async function getAllSubcategoryIds(categoryId) {
  const directSubcategories = await Category.find({ parent: categoryId }).select('_id').lean();
  const directSubcategoryIds = directSubcategories.map(cat => cat._id);
  
  const nestedIds = [];
  for (const subId of directSubcategoryIds) {
    const childIds = await getAllSubcategoryIds(subId);
    nestedIds.push(...childIds);
  }
  
  return [...directSubcategoryIds, ...nestedIds];
}

module.exports = {
  getBookshelfPage
}; 