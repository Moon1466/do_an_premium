const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// Route hiển thị trang tài khoản
router.get('/', accountController.getAccountPage);

module.exports = router; 