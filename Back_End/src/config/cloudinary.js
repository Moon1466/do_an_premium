const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dcqyuixqu',
  api_key:    '676924389238424',
  api_secret: 'cHNDZTOmPjR-6lh5KoCnrlLsW14'
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    return {
      folder: 'your_folder_name',
      // dùng camelCase theo multer-storage-cloudinary
      allowedFormats: ['jpg','png','jpeg','webp','svg'],
      // để Cloudinary tự xử lý SVG như image
      resource_type: 'image'
    };
  }
});

module.exports = { cloudinary, storage };
