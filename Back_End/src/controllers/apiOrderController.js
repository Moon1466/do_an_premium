const Order = require('../model/Orders');
const mongoose = require('mongoose');

const getOrders = async (req, res) => {
    try {
        // Lấy tất cả đơn hàng và sắp xếp theo thời gian tạo mới nhất
        const orders = await Order.find().sort({ createdAt: -1 });
        
        // Render trang order với dữ liệu đơn hàng
        res.render('order', { 
            orders: orders,
            moment: require('moment') // Để format thời gian
        });
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).send('Lỗi khi lấy danh sách đơn hàng');
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error getting order:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin đơn hàng',
            error: error.message
        });
    }
};

const createOrder = async (req, res) => {
    try {
        const orderData = req.body;
        // Ép productId về ObjectId
        if (orderData.products && Array.isArray(orderData.products)) {
            orderData.products = orderData.products.map(item => ({
                ...item,
                productId: new mongoose.Types.ObjectId(item.productId)
            }));
        }
        // Tạo mã đơn hàng tự động theo format ORDER + timestamp
        orderData.orderCode = 'ORDER' + Date.now();
        // Tạo đơn hàng mới
        const newOrder = new Order(orderData);
        await newOrder.save();
        return res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng',
            error: error.message
        });
    }
};

const processPayment = async (req, res) => {
    try {
        const { orderCode, paymentMethod, paymentStatus } = req.body;

        // Validate required fields
        if (!orderCode || !paymentMethod || !paymentStatus) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // Find the order by orderCode
        const order = await Order.findOne({ orderCode });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Update payment information
        order.paymentMethod = paymentMethod;
        order.paymentStatus = paymentStatus;
        
        // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng thành "Đã giao hàng"
        if (paymentStatus === 'Đã thanh toán') {
            order.status = 'Đã giao hàng'; // Thay đổi từ 'Đã xác nhận' thành 'Đã giao hàng'
        } else {
            // Nếu chưa thanh toán, giữ nguyên 'Chờ xác nhận' hoặc trạng thái hiện tại
            if (order.status === 'Chờ xác nhận') {
                order.status = 'Chờ xác nhận';
            }
        }

        // Save the updated order
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thanh toán thành công',
            data: order
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Chấp nhận các trạng thái hợp lệ
        const validStatuses = ['Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Cập nhật trạng thái
        order.status = status;
        
        // Nếu đơn hàng được xác nhận hoặc đang giao, hoặc đã giao => đã thanh toán
        if (status === 'Đã xác nhận' || status === 'Đang giao hàng' || status === 'Đã giao hàng') {
            order.paymentStatus = 'Đã thanh toán';
        }
        
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái đơn hàng',
            error: error.message
        });
    }
};

const getOrdersByUser = async (req, res) => {
    try {
        const userId = req.query.userId;
        let orders;
        if (userId) {
            orders = await Order.find({ 'customer._id': userId }).sort({ createdAt: -1 });
        } else {
            // Nếu không có userId, trả về tất cả đơn hàng
            orders = await Order.find().sort({ createdAt: -1 });
        }
        console.log("API /orders trả về:", orders);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

const updateAllPaidOrdersStatus = async (req, res) => {
    try {
        // Tìm tất cả đơn hàng đã thanh toán nhưng chưa ở trạng thái "Đã giao hàng"
        const result = await Order.updateMany(
            { 
                paymentStatus: 'Đã thanh toán',
                status: { $ne: 'Đã giao hàng' }
            },
            { 
                $set: { status: 'Đã giao hàng' } 
            }
        );

        return res.status(200).json({
            success: true,
            message: `Đã cập nhật ${result.modifiedCount} đơn hàng đã thanh toán thành "Đã giao hàng"`,
            data: result
        });
    } catch (error) {
        console.error('Error updating paid orders status:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái đơn hàng',
            error: error.message
        });
    }
};

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    processPayment,
    updateOrderStatus,
    getOrdersByUser,
    updateAllPaidOrdersStatus
};

