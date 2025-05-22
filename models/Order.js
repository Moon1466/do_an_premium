const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: {
            type: String
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'],
        default: 'Chờ xác nhận'
    },
    paymentMethod: {
        type: String,
        enum: ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Chưa thanh toán', 'Đã thanh toán'],
        default: 'Chưa thanh toán'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema); 