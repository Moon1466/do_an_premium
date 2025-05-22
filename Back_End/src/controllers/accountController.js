const Account = require('../model/Accounts');

// Hiển thị trang tài khoản
const getAccountPage = async (req, res) => {
    try {
        let query = {};
        
        // Xử lý tìm kiếm
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query = {
                $or: [
                    { username: searchRegex },
                    { email: searchRegex },
                    { fullName: searchRegex },
                    { phone: searchRegex }
                ]
            };
        }

        // Lấy danh sách tài khoản từ database
        const users = await Account.find(query).sort({ createdAt: -1 });

        // Render trang với dữ liệu
        res.render('account', {
            users,
            searchTerm: req.query.search || ''
        });
    } catch (error) {
        console.error('Error in getAccountPage:', error);
        res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi tải trang tài khoản'
        });
    }
};

module.exports = {
    getAccountPage
}; 