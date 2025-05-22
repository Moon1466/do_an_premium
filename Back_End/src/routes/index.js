const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const apiSettingController = require('../controllers/apiSettingController');
const bookshelfController = require('../controllers/bookshelfController');
const multer = require('multer');
const upload = multer({ dest: 'public/images/logo/' });

// Dashboard route
router.get('/', dashboardController.getDashboardData);

// Bookshelf route (Quản lý giá sách)
router.get('/bookshelf', bookshelfController.getBookshelfPage);

// Setting update route
router.post('/setting/update', upload.single('logo'), apiSettingController.updateSetting);

module.exports = router; 