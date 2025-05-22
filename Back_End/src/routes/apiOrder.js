const express = require('express');
const router = express.Router();
const apiOrderController = require('../controllers/apiOrderController');

// Route for processing payment
router.post('/process-payment', apiOrderController.processPayment);

module.exports = router; 