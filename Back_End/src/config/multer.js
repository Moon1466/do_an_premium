const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/images/uploads/');
  },
  filename: function (req, file, cb) {
    // Lấy tên không có phần mở rộng
    const originalName = file.originalname.split('.').slice(0, -1).join('.');
    const ext = file.originalname.split('.').pop();
    // Loại bỏ dấu và ký tự đặc biệt
    const safeName = originalName
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
      .replace(/[^a-zA-Z0-9]/g, '_'); // thay ký tự đặc biệt bằng _
    cb(null, Date.now() + '_' + safeName + '.' + ext);
  }
});
const upload = multer({ storage: storage });
module.exports = upload;