const express = require('express')
const router = express.Router();
const Category = require('../model/Categories');
const { getOrders } = require('../controllers/apiOrderController');
const { isAdmin } = require('../middleware/authMiddleware');
const bookshelfController = require('../controllers/bookshelfController');


const {getHome, getProduct, getComment, getSetting, getLogin} = require('../controllers/homeControllers')
const {getCategories, newCategory, showCategory} = require('../controllers/apiCategoryController')

router.get('/', getLogin)
router.get('/home', getHome)

router.get('/product', getProduct)

router.get('/order', getOrders)

router.get('/category', getCategories)

router.get('/categories/new', newCategory);

router.get('/comment', getComment)

router.get('/product/:slug', (req, res) => {
    const slug = req.params.slug
    res.send(`Product detail for ${slug}`)
})

router.get('/setting', getSetting)

// Route hiển thị chi tiết danh mục
router.get('/category/:slugPath', showCategory);

// Route trang đăng nhập admin
router.get('/admin/login', (req, res) => {
    res.render('login');
});

// Các route admin đều được bảo vệ bởi middleware isAdmin
router.get('/admin/dashboard', isAdmin, (req, res) => {
    res.send('Admin Dashboard');
});
router.get('/bookshelf', bookshelfController.getBookshelfPage);

module.exports = router;
 