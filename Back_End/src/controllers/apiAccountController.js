const Account = require('../model/Accounts');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// Hàm trả về URL đầy đủ cho avatar
function getAvatarUrl(avatar) {
  if (avatar && avatar.startsWith('http')) return avatar;
  // Nếu không có avatar, trả về URL mặc định Cloudinary do user cung cấp
  return 'https://res.cloudinary.com/dcqyuixqu/image/upload/v1745775273/logo_user_empty_a971qi.png';
}

// Đăng nhập
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm tài khoản theo email
        const account = await Account.findOne({ email });
        if (!account) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, account.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Trả về thông tin tài khoản (không bao gồm mật khẩu)
        res.json({
            success: true,
            account: {
                _id: account._id,
                username: account.username,
                email: account.email,
                fullName: account.fullName,
                phone: account.phone,
                role: account.role,
                avatar: account.avatar || 'https://res.cloudinary.com/dcqyuixqu/image/upload/v1745775273/logo_user_empty_a971qi.png'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng nhập'
        });
    }
};

// Đăng nhập dành cho admin
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm tài khoản theo email
        const account = await Account.findOne({ email });
        if (!account) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, account.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra role admin
        if (account.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập trang quản trị'
            });
        }

        // Tạo JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: account._id, role: account.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        // Trả về thông tin tài khoản admin và token
        res.json({
            success: true,
            account: {
                _id: account._id,
                username: account.username,
                email: account.email,
                fullName: account.fullName,
                role: account.role,
                avatar: getAvatarUrl(account.avatar),
                token
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng nhập'
        });
    }
};

// Lấy danh sách tài khoản
const getAllAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({});
        res.json({
            success: true,
            accounts: accounts
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tài khoản'
        });
    }
};

// Lấy thông tin tài khoản theo ID
const getAccountById = async (req, res) => {
    try {
         const account = await Account.findById(req.params.id);
        
        if (!account) {
           
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

      
        // Ensure address data is included and properly structured
        const responseData = {
            success: true,
            account: {
                _id: account._id,
                username: account.username,
                email: account.email,
                fullName: account.fullName,
                phone: account.phone,
                role: account.role,
                avatar: getAvatarUrl(account.avatar),
                address: account.address ? {
                    province: account.address.province || '',
                    district: account.address.district || '',
                    ward: account.address.ward || '',
                    city: account.address.city || '',
                    detail: account.address.detail || ''
                } : {
                    province: '',
                    district: '',
                    ward: '',
                    city: '',
                    detail: ''
                }
            }
        };

      
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin tài khoản'
        });
    }
};

// Tạo tài khoản mới
const createAccount = async (req, res) => {
    try {
        const { username, email, password, fullName, phone, role, address } = req.body;
        
        // Kiểm tra định dạng file nếu có
        if (req.file) {
            const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
            if (!allowedFormats.includes(req.file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF'
                });
            }
        }
         
        // Kiểm tra username đã tồn tại
        const existingUsername = await Account.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập đã tồn tại'
            });
        }
        // Kiểm tra email đã tồn tại
        const existingEmail = await Account.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại'
            });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Tạo account mới với địa chỉ mặc định nếu không có
        const newAccount = new Account({
            username,
            email,
            password: hashedPassword,
            fullName,
            phone: phone || '',
            role: role || 'user',
            address: address ? {
                province: address.province || '',
                district: address.district || '',
                ward: address.ward || '',
                detail: address.detail || ''
            } : {
                province: '',
                district: '',
                ward: '',
                detail: ''
            },
            avatar: req.file && req.file.path ? req.file.path : 'https://res.cloudinary.com/dcqyuixqu/image/upload/v1745775273/logo_user_empty_a971qi.png'
        });
        
        await newAccount.save();
        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản thành công',
            account: {
                username: newAccount.username,
                email: newAccount.email,
                fullName: newAccount.fullName,
                role: newAccount.role
            }
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo tài khoản',
            error: error.message
        });
    }
};

// Cập nhật tài khoản
const updateAccount = async (req, res) => {
    try {
        const { username, password, email, fullName, phone, role, address } = req.body;
        const accountId = req.params.id;

        // Kiểm tra tài khoản tồn tại
        const existingAccount = await Account.findById(accountId);
        if (!existingAccount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        // Cập nhật thông tin
        const updateData = {
            username,
            email,
            fullName,
            phone,
            role,
        };

        // Chỉ cập nhật address nếu có gửi lên
        if (address) {
            updateData.address = {
                province: address.province || '',
                district: address.district || '',
                ward: address.ward || '',
                detail: address.detail || ''
            };
        }

        // Chỉ cập nhật mật khẩu nếu có thay đổi
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Cập nhật avatar nếu có file mới
        if (req.file && req.file.path) {
            updateData.avatar = req.file.path;
        }

        const updatedAccount = await Account.findByIdAndUpdate(
            accountId,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Cập nhật tài khoản thành công',
            account: updatedAccount
        });
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tài khoản'
        });
    }
};

// Xóa tài khoản
const deleteAccount = async (req, res) => {
    try {
        const accountId = req.params.id;
        const deletedAccount = await Account.findByIdAndDelete(accountId);
        
        if (!deletedAccount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        res.json({
            success: true,
            message: 'Xóa tài khoản thành công'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tài khoản'
        });
    }
};

module.exports = {
    login,
    adminLogin,
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount
}; 