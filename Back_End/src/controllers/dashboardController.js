const Order = require('../model/Orders');
const Product = require('../model/Products');
const Account = require('../model/Accounts');

const getDashboardData = async (req, res) => {
    try {
        // Get total revenue
        const orders = await Order.find({ status: 'Đã giao hàng' });
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        // Get total orders
        const totalOrders = await Order.countDocuments();

        // Get total products
        const totalProducts = await Product.countDocuments();

        // Get total users (excluding admins)
        const totalUsers = await Account.countDocuments({ role: 'user' });

        // Get payment statistics
        const paidOrders = await Order.countDocuments({ paymentStatus: 'Đã thanh toán' });
        const unpaidOrders = await Order.countDocuments({ paymentStatus: 'Chưa thanh toán' });
        const paymentRate = totalOrders > 0 ? (paidOrders / totalOrders * 100).toFixed(1) : 0;

        // Get payment method distribution
        const paymentMethods = await Order.aggregate([
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to object
        const paymentMethodObj = {
            'Tiền mặt': 0,
            'Chuyển khoản': 0,
            'Thẻ tín dụng': 0
        };
        paymentMethods.forEach(item => {
            paymentMethodObj[item._id] = item.count;
        });

        // Get monthly revenue for current year
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    status: 'Đã giao hàng',
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Convert to array of 12 months
        const monthlyRevenueArray = new Array(12).fill(0);
        monthlyRevenue.forEach(item => {
            monthlyRevenueArray[item._id - 1] = item.total;
        });

        // Get order status count
        const orderStatusCount = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to object
        const orderStatusObj = {
            'Chờ xác nhận': 0,
            'Đã xác nhận': 0,
            'Đang giao hàng': 0,
            'Đã giao hàng': 0,
            'Đã hủy': 0
        };
        orderStatusCount.forEach(item => {
            orderStatusObj[item._id] = item.count;
        });

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer._id', 'fullName')
            .lean();

        // Format recent orders
        const formattedRecentOrders = recentOrders.map(order => ({
            _id: order._id,
            customerName: order.customer ? order.customer.name : 'Khách vãng lai',
            items: Array.isArray(order.products) ? order.products : [],
            totalAmount: order.totalAmount,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt
        }));

        res.render('dashboard', {
            totalRevenue,
            totalOrders,
            totalProducts,
            totalUsers,
            paidOrders,
            unpaidOrders,
            paymentRate,
            paymentMethodObj,
            monthlyRevenue: monthlyRevenueArray,
            orderStatusCount: orderStatusObj,
            recentOrders: formattedRecentOrders
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải dữ liệu dashboard'
        });
    }
};

module.exports = {
    getDashboardData
}; 