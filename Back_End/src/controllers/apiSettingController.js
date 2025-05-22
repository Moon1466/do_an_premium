const path = require('path');
const fs = require('fs');
const Settings = require('../model/Settings');

// Nếu có model Settings thì require vào đây
// const Settings = require('../model/Settings');

// Tạm thời lưu settings vào biến toàn cục (nếu chưa có DB)
let settings = {
  logo: '/images/logo/logo.svg',
  address: '',
  phone: '',
  gmail: ''
};

const updateSetting = async (req, res) => {
  try {
    // Lấy url ảnh từ Cloudinary
    let logoUrl = undefined;
    if (req.file && req.file.path) {
      logoUrl = req.file.path; // Multer-Cloudinary sẽ trả về url tại file.path
    }
    // Lấy dữ liệu từ form
    const updateData = {
      address: req.body.address,
      phone: req.body.phone,
      gmail: req.body.gmail
    };
    if (logoUrl) updateData.logo = logoUrl;

    // Tìm bản ghi settings đầu tiên, nếu có thì update, không có thì tạo mới
    let settings = await Settings.findOne();
    if (settings) {
      await Settings.updateOne({ _id: settings._id }, updateData);
    } else {
      await Settings.create({ ...updateData, logo: logoUrl || '/images/logo/logo.svg' });
    }
    res.redirect('/setting');
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).send('Lỗi cập nhật cài đặt');
  }
};

const getSetting = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy thông tin cài đặt' });
  }
};

module.exports = { updateSetting, getSetting };
