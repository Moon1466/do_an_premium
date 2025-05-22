const Product = require('../model/Products');
const Category = require('../model/Categories');
const Order = require('../model/Orders');
const User = require('../model/Accounts');
const Settings = require('../model/Settings');

const getHome = async (req, res) => {
    try {
        // Cập nhật tổng doanh thu: Lấy từ tất cả đơn hàng đã thanh toán thành công
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'Đã thanh toán' } }, // Thay đổi từ status: 'Đã giao hàng' thành paymentStatus: 'Đã thanh toán'
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        // Lấy tổng số đơn hàng
        const totalOrders = await Order.countDocuments();
        
        // Lấy tổng số sản phẩm
        const totalProducts = await Product.countDocuments();
        
        // Lấy tổng số người dùng
        const totalUsers = await User.countDocuments();
        
        // Lấy doanh thu theo tháng
        const monthlyRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'Đã thanh toán' } }, // Thay đổi từ status: 'Đã giao hàng' thành paymentStatus: 'Đã thanh toán'
            { $group: { 
                _id: { $month: '$createdAt' },
                total: { $sum: '$totalAmount' }
            }},
            { $sort: { _id: 1 } }
        ]);
        
        // Nhóm lại trạng thái đơn hàng thành 3 nhóm chính dựa trên trạng thái đơn hàng và trạng thái thanh toán
        const simplifiedOrderStatus = {
            'Đang xử lý': 0,
            'Hoàn thành': 0,
            'Đã hủy': 0
        };

        // Truy vấn đếm số lượng đơn hàng đang xử lý (chưa thanh toán)
        const ordersInProgress = await Order.countDocuments({
            status: { $in: ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng'] },
            paymentStatus: 'Chưa thanh toán'
        });
        
        // Truy vấn đếm số lượng đơn hàng đã hoàn thành (đã thanh toán hoặc đã giao hàng)
        const completedOrders = await Order.countDocuments({
            $or: [
                { status: 'Đã giao hàng' },
                { paymentStatus: 'Đã thanh toán' }
            ]
        });
        
        // Truy vấn đếm số lượng đơn hàng đã hủy
        const cancelledOrders = await Order.countDocuments({
            status: 'Đã hủy'
        });
        
        simplifiedOrderStatus['Đang xử lý'] = ordersInProgress;
        simplifiedOrderStatus['Hoàn thành'] = completedOrders;
        simplifiedOrderStatus['Đã hủy'] = cancelledOrders;

        // Thêm mới: Lấy thông tin thanh toán
        const paidOrders = await Order.countDocuments({ paymentStatus: 'Đã thanh toán' });
        const unpaidOrders = await Order.countDocuments({ paymentStatus: 'Chưa thanh toán' });
        const paymentRate = totalOrders > 0 ? (paidOrders / totalOrders * 100).toFixed(1) : 0;

        // Thêm mới: Thống kê phương thức thanh toán
        const paymentMethods = await Order.aggregate([
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Chuyển đổi thành đối tượng
        const paymentMethodObj = {
            'Tiền mặt': 0,
            'Chuyển khoản': 0,
            'Thẻ tín dụng': 0
        };
        paymentMethods.forEach(item => {
            if (item._id) {
                paymentMethodObj[item._id] = item.count;
            }
        });
        
        // Lấy danh sách đơn hàng gần đây
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Format đơn hàng gần đây
        const formattedRecentOrders = recentOrders.map(order => {
            // Phân loại trạng thái đơn hàng dựa trên cả trạng thái đơn hàng và trạng thái thanh toán
            let simplifiedStatus;
            
            if (order.status === 'Đã hủy') {
                simplifiedStatus = 'Đã hủy';
            } else if (order.status === 'Đã giao hàng' || order.paymentStatus === 'Đã thanh toán') {
                simplifiedStatus = 'Hoàn thành';
            } else {
                simplifiedStatus = 'Đang xử lý';
            }
            
            return {
                _id: order._id,
                customerName: order.customer ? order.customer.name : 'Khách vãng lai',
                items: Array.isArray(order.products) ? order.products : [],
                totalAmount: order.totalAmount,
                status: simplifiedStatus,
                originalStatus: order.status,
                paymentStatus: order.paymentStatus || 'Chưa thanh toán',
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt
            };
        });
        
        res.render('dashboard', {
            totalRevenue: totalRevenue[0]?.total || 0,
            totalOrders,
            totalProducts,
            totalUsers,
            paidOrders,
            unpaidOrders,
            paymentRate,
            paymentMethodObj,
            monthlyRevenue: Array(12).fill(0).map((_, i) => {
                const monthData = monthlyRevenue.find(m => m._id === i + 1);
                return monthData ? monthData.total : 0;
            }),
            orderStatusCount: simplifiedOrderStatus,
            recentOrders: formattedRecentOrders
        });
    } catch (error) {
        console.error('Lỗi khi tải trang Dashboard:', error);
        res.render('dashboard', {
            totalRevenue: 0,
            totalOrders: 0,
            totalProducts: 0,
            totalUsers: 0,
            paidOrders: 0,
            unpaidOrders: 0,
            paymentRate: 0,
            paymentMethodObj: {
                'Tiền mặt': 0,
                'Chuyển khoản': 0,
                'Thẻ tín dụng': 0
            },
            monthlyRevenue: Array(12).fill(0),
            orderStatusCount: {
                'Đang xử lý': 0,
                'Hoàn thành': 0,
                'Đã hủy': 0
            },
            recentOrders: []
        });
    }
}

const getProduct = async (req, res) => {
    try {
        let query = {};
        
        // Nếu có tham số tìm kiếm
        if (req.query.search) {
            query = {
                name: { 
                    $regex: new RegExp(req.query.search, 'i') // Tìm kiếm không phân biệt hoa thường và dấu
                }
            };
        }
        
        const products = await Product.find(query).populate({
            path: 'category',
            populate: {
                path: 'parent'
            }
        });
        
        // Lấy tất cả categories và phân loại
        const allCategories = await Category.find();
        const parentCategories = allCategories.filter(cat => !cat.parent);
        const childCategories = allCategories.filter(cat => cat.parent);
        
        res.render('product', { 
            products, 
            categories: allCategories,
            parentCategories,
            childCategories,
            searchTerm: req.query.search || ''
        });
    } catch (error) {
        res.render('product', { 
            products: [],
            categories: [],
            parentCategories: [],
            childCategories: [],
            searchTerm: req.query.search || '',
            error: 'Có lỗi xảy ra khi tìm kiếm sản phẩm'
        });
    }
}

const getOrder = (req, res) => {
    res.render('order');
}

const getAccount = (req, res) => {
    res.render('account');
}

const getComment = async (req, res) => {
    try {
        // Lấy danh sách sản phẩm, có thể chọn trường cần thiết
        const products = await Product.find().lean();

        // Nếu sản phẩm chưa có rating, bạn có thể gán mặc định để test
        const productsWithRating = products.map(p => ({
            ...p,
            rating: p.rating || 5, // hoặc lấy rating thực tế nếu có
            image: p.images && p.images.length > 0 ? p.images[0] : '/images/default.jpg'
        }));

        res.render('comment', { products: productsWithRating });
    } catch (error) {
        res.render('comment', { products: [] });
    }
};

const getCategory = async (req, res) => {
    try {
      // Lấy danh sách danh mục cha
      const categories = await Category.find({ parent: null }).lean();
  
      // Đếm số lượng danh mục con cho từng danh mục cha
      const categoriesWithSubCount = await Promise.all(
        categories.map(async (cat) => {
          const subCategoriesCount = await Category.countDocuments({ parent: cat._id });
          return { ...cat, subCategoriesCount };
        })
      );
  
      res.render('category', { categories: categoriesWithSubCount });
    } catch (err) {
      console.error('Lỗi fetch categories:', err);
      res.status(500).send('Server Error');
    }
  };

const getSetting = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.render('setting', { settings });
    } catch (error) {
        res.render('setting', { settings: null });
    }
}

const getLogin = (req, res) => {
    res.render('login');
}
 

module.exports = {
    getHome,
    getProduct,
    getOrder,
    getAccount,
    getComment,
    getCategory,
    getSetting,
    getLogin
}