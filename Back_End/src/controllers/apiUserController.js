const User = require('../model/Users');

// Lấy danh sách người dùng
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách người dùng'
        });
    }
};

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng'
        });
    }
};

// Tạo người dùng mới
const createUser = async (req, res) => {
    try {
        const { username, password, email, fullName, phone, role } = req.body;
        
        // Kiểm tra username đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Tạo người dùng mới
        const newUser = new User({
            username,
            password,
            email,
            fullName,
            phone,
            role,
            avatar: req.file ? req.file.filename : 'default-avatar.png'
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản thành công',
            user: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo tài khoản'
        });
    }
};

// Cập nhật người dùng
const updateUser = async (req, res) => {
    try {
        const { username, password, email, fullName, phone, role } = req.body;
        const userId = req.params.id;

        // Kiểm tra người dùng tồn tại
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Cập nhật thông tin
        const updateData = {
            username,
            email,
            fullName,
            phone,
            role
        };

        // Chỉ cập nhật mật khẩu nếu có thay đổi
        if (password) {
            updateData.password = password;
        }

        // Cập nhật avatar nếu có file mới
        if (req.file) {
            updateData.avatar = req.file.filename;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Cập nhật tài khoản thành công',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tài khoản'
        });
    }
};

// Xóa người dùng
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Xóa tài khoản thành công'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tài khoản'
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
}; 