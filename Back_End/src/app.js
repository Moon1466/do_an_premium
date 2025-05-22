const express = require('express')
const path = require('path')
require('dotenv').config()
const EventEmitter = require('events');
const cookieParser = require('cookie-parser');
EventEmitter.defaultMaxListeners = 15; // Tăng giới hạn listeners lên 15

const app = express()

const configViewEngine = require('./config/viewEngine')
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api')
const accountRoute = require('./routes/accountRoute');
const connection = require('./config/database')
const addressRouter = require('./routes/address');

const port = process.env.PORT || 3000
const hostname = process.env.HOST_NAME || 'localhost'

// Middleware để parse JSON và dữ liệu từ form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie-parser middleware

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(express.static('src/public')); // Đảm bảo đường dẫn đúng tới thư mục chứa ảnh, css, js

// Cấu hình view engine
configViewEngine(app)

// API routes
app.use('/api/address', addressRouter);
app.use('/api', apiRoutes);

// Page routes - đặt route /account trước route chung /
app.use('/account', accountRoute);
app.use('/', webRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('error', {
        message: err.message || 'Có lỗi xảy ra trong quá trình xử lý'
    });
});

// Kết nối cơ sở dữ liệu và khởi chạy server
(async () => {
    try {
        await connection();
        app.listen(port, () => {
            console.log(`Server is running at http://${hostname}:${port}`);
            console.log('Routes configured in order:');
            console.log('1. Static files');
            console.log('2. API routes (/api/address, /api)');
            console.log('3. Account page (/account)');
            console.log('4. Web routes (/)');
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
})();