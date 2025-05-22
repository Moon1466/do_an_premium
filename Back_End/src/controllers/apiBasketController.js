const Basket = require('../model/Basket');
const Product = require('../model/Products');

// Thêm sản phẩm vào giỏ
exports.addToBasket = async (req, res) => {
  try {
    const { userId, userName, userAvatar, productId, productName, productImage, quantity, price } = req.body;

    console.log("Body nhận được:", req.body);
    console.log("userId:", userId, "userName:", userName, "userAvatar:", userAvatar);

    let basket = await Basket.findOne({ userId });

    if (!basket) {
      // Nếu chưa có giỏ, tạo mới
      basket = new Basket({
        userId,
        userName,
        userAvatar,
        items: [{
          productId,
          productName,
          productImage,
          quantity,
          price
        }]
      });
    } else {
      // Nếu đã có giỏ, kiểm tra sản phẩm đã có chưa
      const itemIndex = basket.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        // Nếu đã có, cập nhật số lượng
        basket.items[itemIndex].quantity += quantity;
      } else {
        // Nếu chưa có, thêm mới
        basket.items.push({
          productId,
          productName,
          productImage,
          quantity,
          price
        });
      }
    }

    await basket.save();
    res.json({ success: true, data: basket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy giỏ hàng của user (có thêm thông tin giảm giá từ sản phẩm)
exports.getBasket = async (req, res) => {
  try {
    const { userId } = req.params;
    let basket = await Basket.findOne({ userId });

    if (!basket) {
      // Nếu không tìm thấy giỏ hàng, trả về giỏ hàng rỗng
      return res.json({ success: true, data: { userId, items: [] } });
    }

    // Lấy thông tin chi tiết sản phẩm cho từng item trong giỏ hàng
    const populatedItems = await Promise.all(
      basket.items.map(async (item) => {
        const productDetail = await Product.findById(item.productId).select('isSale sale'); // Chỉ lấy trường isSale và sale
        return {
          ...item.toObject(), // Chuyển Mongoose document sang plain object
          isSale: productDetail?.isSale || false, // Thêm thông tin isSale
          sale: productDetail?.sale || 0 // Thêm thông tin sale
        };
      })
    );

    // Cập nhật lại giỏ hàng với thông tin sản phẩm đầy đủ
    const basketWithProductDetails = {
      ...basket.toObject(),
      items: populatedItems
    };

    res.json({ success: true, data: basketWithProductDetails });
  } catch (err) {
    console.error('Error fetching basket with product details:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromBasket = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    const basket = await Basket.findOne({ userId });
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });
    }

    // Lọc ra sản phẩm cần xóa
    basket.items = basket.items.filter(item => item.productId.toString() !== productId);
    
    await basket.save();
    res.json({ success: true, data: basket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};