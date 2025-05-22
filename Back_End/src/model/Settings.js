const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  logo: { type: String, default: '/images/logo/logo.svg' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  gmail: { type: String, default: '' }
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
