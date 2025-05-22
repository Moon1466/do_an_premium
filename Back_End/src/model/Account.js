const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Thông tin cơ bản
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },

  // Thông tin bổ sung
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  address: {
    street: String,
    city: String,
    district: String,
    ward: String,
    detail: String
  },

  // Phân quyền
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);
module.exports = User;