const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

router.get('/provinces', addressController.getProvinces);
router.get('/provinces/:provinceCode/districts', addressController.getDistrictsByProvince);
router.get('/districts/:districtCode/wards', addressController.getWardsByDistrict);

module.exports = router; 