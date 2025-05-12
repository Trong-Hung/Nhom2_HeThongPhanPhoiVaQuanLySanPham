const multer = require('multer');
const path = require('path');

// Cấu hình lưu file vào thư mục uploads bên ngoài src
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads')); // Lưu vào thư mục uploads bên ngoài src
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Tên file duy nhất
  }
});

// Kiểm tra định dạng file và kích thước
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']; // Các định dạng ảnh hợp lệ
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Được phép tải lên
  } else {
    cb(new Error('Ảnh không hợp lệ'), false); // Không hợp lệ
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file (5MB)
  fileFilter: fileFilter // Kiểm tra định dạng file
});

module.exports = upload;
