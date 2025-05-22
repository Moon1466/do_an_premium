const express = require('express');
const mongoose = require('mongoose');
const routerAPI = express.Router();
const Category = require('../model/Categories');
const Product = require('../model/Products');
const Account = require('../model/Accounts');
const apiOrderController = require('../controllers/apiOrderController');
const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

const { createCategory, getCategoriesAPI, getCategoriesbySlugPath , getCategoryById, updatedCategory  , deleteCategory} = require('../controllers/apiCategoryController');
const { addProduct , getAllProducts, getProductById, updateProductStatus, deleteProduct, updateProduct, deleteSubImage, getProductBySlug, getProductsByCategory } = require('../controllers/apiProductController');
const { createAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount, login, adminLogin } = require('../controllers/apiAccountController');
const apiCommentController = require('../controllers/apiCommentController');
const basketController = require('../controllers/apiBasketController');
const apiSettingController = require('../controllers/apiSettingController');

// ------------ Category ------------------- //

routerAPI.post('/categories', createCategory); // Sử dụng createCategory từ controller
routerAPI.get('/categories', getCategoriesAPI); // Lấy tất cả danh mục cho FE (trả về JSON)
routerAPI.get('/categories/slug/:slugPath', getCategoriesbySlugPath); // Lấy chi tiết theo slugPath
routerAPI.get('/categories/:id', getCategoryById); // Lấy chi tiết theo id
routerAPI.put('/categories/:id', updatedCategory); // Cập nhật danh mục
routerAPI.delete('/categories/:id', deleteCategory); // Xóa danh mục

// ------------ Product ------------------- //

// Route thêm sản phẩm
routerAPI.post('/add', upload.fields([
  { name: 'images', maxCount: 1 },
  { name: 'subImages', maxCount: 10 }
]), addProduct);

// Route lấy tất cả sản phẩm và tìm kiếm
routerAPI.get('/products', getAllProducts);
routerAPI.get('/product', getAllProducts); // Thêm route mới cho trang product với tìm kiếm

// Route lấy sản phẩm theo categoryId (bao gồm cả danh mục con)
routerAPI.get('/products/by-category', (req, res, next) => {
  console.log('ROUTE /products/by-category TRIGGERED');
  next();
}, getProductsByCategory);

// Route lấy thông tin sản phẩm theo slug
routerAPI.get('/products/slug/:slug', getProductBySlug);

// Route lấy thông tin sản phẩm
routerAPI.get('/products/:id', getProductById);

// Route cập nhật trạng thái sản phẩm
routerAPI.put('/products/:id/status', updateProductStatus);

// Route cập nhật sản phẩm
routerAPI.put('/products/:id', upload.fields([
  { name: 'images', maxCount: 1 },
  { name: 'subImages', maxCount: 10 }
]), updateProduct);

// Route xóa sản phẩm
routerAPI.delete('/products/:id', deleteProduct);

// Route xóa ảnh phụ của sản phẩm - đặt trước route get product để tránh xung đột
routerAPI.delete('/products/:id/subimage/:index', deleteSubImage);

// ------------ Account ------------------- //
routerAPI.get('/accounts', getAllAccounts); // Lấy danh sách tài khoản
routerAPI.get('/accounts/:id', getAccountById); // Lấy chi tiết tài khoản
routerAPI.post('/account/create', upload.single('avatar'), createAccount); // Tạo tài khoản mới
routerAPI.post('/account/login', login);
routerAPI.post('/accounts/admin-login', adminLogin); // Admin login endpoint
routerAPI.put('/accounts/:id', upload.single('avatar'), updateAccount); // Cập nhật tài khoản
routerAPI.delete('/accounts/:id', deleteAccount); // Xóa tài khoản

// ------------ Order ------------------- //
routerAPI.post('/orders/create', apiOrderController.createOrder);
routerAPI.get('/orders', apiOrderController.getOrdersByUser);
routerAPI.get('/orders/:id', apiOrderController.getOrderById);
routerAPI.put('/orders/:id/status', apiOrderController.updateOrderStatus);
routerAPI.post('/process-payment', apiOrderController.processPayment);
routerAPI.post('/orders/update-all-paid', apiOrderController.updateAllPaidOrdersStatus);

// ------------ Comment ------------------- //
routerAPI.get('/comments/:productId', apiCommentController.getProductComments);
routerAPI.post('/comments/:productId', apiCommentController.addProductComment);
// Route để thích/bỏ thích một review cụ thể trong một comment
routerAPI.put('/comments/:commentId/reviews/:reviewId/like', apiCommentController.toggleReviewLike);

// ------------ Basket ------------------- //
routerAPI.post('/basket/add', basketController.addToBasket);
routerAPI.get('/basket/:userId', basketController.getBasket);
routerAPI.delete('/basket/:userId/:productId', basketController.removeFromBasket);

// ------------ Setting ------------------- //
routerAPI.post('/setting/update', upload.single('logo'), apiSettingController.updateSetting);
routerAPI.get('/setting', apiSettingController.getSetting);

module.exports = routerAPI;
