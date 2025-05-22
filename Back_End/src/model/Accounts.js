const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        province: {
            type: String,
            default: ''
        },
        district: {
            type: String,
            default: ''
        },
        ward: {
            type: String,
            default: ''
        },
        detail: {
            type: String,
            default: ''
        }
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Tự động quản lý createdAt và updatedAt
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account; 