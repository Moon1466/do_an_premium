const Comment = require('../model/Comments');
const Product = require('../model/Products');
const mongoose = require('mongoose');
const Account = require('../model/Accounts');

// Lấy chi tiết đánh giá và bình luận cho 1 sản phẩm
const getProductComments = async (req, res) => {
  try {
    const productId = req.params.productId;
    // Lấy tên sản phẩm
    const product = await Product.findById(productId);
    if (!product) return res.json({ success: false, message: 'Không tìm thấy sản phẩm' });

    // Lấy tất cả comment liên quan đến sản phẩm này
    const comments = await Comment.find({ product: productId });
    // Gom tất cả review lại thành 1 mảng
    let allReviews = [];
    comments.forEach(c => {
      if (Array.isArray(c.reviews)) {
        c.reviews.forEach(r => {
          allReviews.push({
            userName: c.userInfo?.name || 'Ẩn danh',
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt
          });
        });
      }
    });
    // Thống kê số lượng từng loại rating
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) stats[r.rating]++;
    });
    res.json({
      success: true,
      productName: product.name,
      stats,
      comments: allReviews
    });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// Thêm bình luận cho sản phẩm
const addProductComment = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    console.log('--- LOG addProductComment ---');
    console.log('userId FE gửi lên:', userId);
    console.log('productId FE gửi lên:', productId, 'length:', productId.length);
    console.log('rating FE gửi lên:', rating);
    console.log('comment FE gửi lên:', comment);
    if (!userId || !rating || !comment) {
      console.log('Thiếu thông tin:', { userId, rating, comment });
      return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });
    }
    // Kiểm tra productId hợp lệ
    let objectProductId;
    try {
      objectProductId = new mongoose.Types.ObjectId(productId);
    } catch (err) {
      console.error('productId không hợp lệ:', productId, 'length:', productId.length, err);
      return res.status(400).json({ success: false, message: 'productId không hợp lệ' });
    }
    // Kiểm tra đã mua và nhận hàng thành công chỉ bằng email
    const Order = require('../model/Orders');
    const orders = await Order.find({
      'customer.email': userId,
      status: 'Đã xác nhận',
      'products.productId': objectProductId
    });
    console.log('Kết quả tìm đơn hàng:', orders);
    if (!orders || orders.length === 0) {
      return res.status(403).json({ success: false, message: 'Bạn chưa mua và nhận hàng thành công sản phẩm này.' });
    }
    // Kiểm tra đã bình luận chưa
    const existingComment = await Comment.findOne({
      product: objectProductId,
      userEmail: userId
    });
    if (existingComment) {
      return res.status(403).json({ success: false, message: 'Bạn chỉ được bình luận 1 lần cho mỗi sản phẩm.' });
    }
    // --- Bổ sung: Lấy thông tin User và Product --- 
    const userAccount = await Account.findOne({ email: userId });
    if (!userAccount) {
        console.error('Không tìm thấy user với email:', userId);
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
    }
    // Product model đã được import ở đầu file
    const productData = await Product.findById(objectProductId);
     if (!productData) {
        console.error('Không tìm thấy product với id:', objectProductId);
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin sản phẩm.' });
    }
    // ----------------------------------------------
    // Tạo comment mới
    try {
      const newComment = new Comment({
        product: objectProductId,
        user: userAccount._id,
        userEmail: userId,
        userName: userAccount.fullName || userAccount.name || userAccount.username,
        userInfo: {
            name: userAccount.fullName || userAccount.name || userAccount.username,
        },
        productInfo: {
            name: productData.name,
            image: productData.images && productData.images.length > 0 ? productData.images[0] : null
        },
        reviews: [{
            rating,
            comment
        }]
      });
      await newComment.save();
      return res.status(201).json({ success: true, message: 'Bình luận thành công!' });
    } catch (err) {
      console.error('Lỗi khi tạo comment:', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi tạo comment', error: err.message });
    }
  } catch (err) {
    console.error('Lỗi ngoài try:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// API: Thích hoặc bỏ thích một review
const toggleReviewLike = async (req, res) => {
  try {
    const { commentId, reviewId } = req.params; // Lấy IDs từ URL params
    const { userId } = req.body; // Lấy user ID (email) từ body

    console.log('--- LOG toggleReviewLike ---');
    console.log('commentId:', commentId);
    console.log('reviewId:', reviewId);
    console.log('userId (email):', userId);

    // Kiểm tra tính hợp lệ của IDs
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'IDs bình luận hoặc review không hợp lệ' });
    }

    // Tìm người dùng bằng email để lấy ObjectId
    const userAccount = await Account.findOne({ email: userId });
    if (!userAccount) {
      console.error('Không tìm thấy user với email:', userId);
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
    }

    // Tìm comment theo ID
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Sử dụng phương thức toggleLikeReview từ schema
    await comment.toggleLikeReview(reviewId, userAccount._id);

    // Tìm lại comment để lấy số lượng like mới nhất sau khi save
    const updatedComment = await Comment.findById(commentId);
    const updatedReview = updatedComment.reviews.id(reviewId);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thích thành công',
      likesCount: updatedReview.likes // Trả về số lượng like mới nhất
    });

  } catch (err) {
    console.error('Lỗi trong toggleReviewLike:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái thích', error: err.message });
  }
};

module.exports = { getProductComments, addProductComment, toggleReviewLike };
