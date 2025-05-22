const jwt = require('jsonwebtoken');
const Account = require('../model/Accounts');

// Middleware to protect admin routes
const isAdmin = async (req, res, next) => {
    try {
        // Get token from the authorization header
        const token = req.cookies.adminToken || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.redirect('/admin/login');
        }
        
        // Verify token (you'll need to set up a JWT_SECRET in your environment)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        // Check if user exists and is admin
        const user = await Account.findById(decoded.id);
        if (!user || user.role !== 'admin') {
            return res.redirect('/admin/login');
        }
        
        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.redirect('/admin/login');
    }
};

module.exports = {
    isAdmin
}; 