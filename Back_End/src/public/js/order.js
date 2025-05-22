// Lấy các phần tử DOM
const modal = document.getElementById('orderModal');
const modalClose = document.querySelector('.modal__close');
const modalBody = document.querySelector('.modal__body');

// Đóng modal khi click vào nút close
modalClose.onclick = function() {
    modal.style.display = "none";
}

// Đóng modal khi click ra ngoài
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Hàm mở modal và hiển thị chi tiết đơn hàng
async function openOrderModal(orderId) {
    try {
        // Gọi API để lấy chi tiết đơn hàng
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            const order = data.data;
            
            // Format thời gian
            const createdAt = new Date(order.createdAt).toLocaleString('vi-VN');
            
            // Tạo HTML cho chi tiết đơn hàng
            const html = `
                <div class="order-detail">
                    <div class="order-detail__section">
                        <h3 class="order-detail__title">Thông tin đơn hàng</h3>
                        <div class="order-detail__info">
                            <div class="order-detail__item">
                                <span class="order-detail__label">Mã đơn hàng:</span>
                                <span class="order-detail__value">${order.orderCode}</span>
                            </div>
                            <div class="order-detail__item">
                                <span class="order-detail__label">Ngày tạo:</span>
                                <span class="order-detail__value">${createdAt}</span>
                            </div>
                            <div class="order-detail__item">
                                <span class="order-detail__label">Trạng thái:</span>
                                <span class="order-detail__value">${order.status}</span>
                            </div>
                            <div class="order-detail__item">
                                <span class="order-detail__label">Phương thức thanh toán:</span>
                                <span class="order-detail__value">${order.paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    <div class="order-detail__section">
                        <h3 class="order-detail__title">Thông tin khách hàng</h3>
                        <div class="order-detail__info">
                            <div class="order-detail__item">
                                <span class="order-detail__label">Họ tên:</span>
                                <span class="order-detail__value">${order.customer.name}</span>
                            </div>
                            <div class="order-detail__item">
                                <span class="order-detail__label">Email:</span>
                                <span class="order-detail__value">${order.customer.email}</span>
                            </div>
                            <div class="order-detail__item">
                                <span class="order-detail__label">Số điện thoại:</span>
                                <span class="order-detail__value">${order.customer.phone}</span>
                            </div>
                            <div class="order-detail__item">
                                <span class="order-detail__label">Địa chỉ:</span>
                                <span class="order-detail__value">${order.customer.address}</span>
                            </div>
                        </div>
                    </div>

                    <div class="order-detail__section">
                        <h3 class="order-detail__title">Sản phẩm</h3>
                        <table class="order-detail__products">
                            <thead>
                                <tr>
                                    <th>Hình ảnh</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Giá</th>
                                    <th>Số lượng</th>
                                    <th>Tổng</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.products.map(product => `
                                    <tr>
                                        <td><img src="${product.image}" alt="${product.name}"></td>
                                        <td>${product.name}</td>
                                        <td>${product.price.toLocaleString('vi-VN')} đ</td>
                                        <td>${product.quantity}</td>
                                        <td>${(product.price * product.quantity).toLocaleString('vi-VN')} đ</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="order-detail__total">
                            <strong>Tổng tiền: ${order.totalAmount.toLocaleString('vi-VN')} đ</strong>
                        </div>
                    </div>
                </div>
            `;
            
            // Cập nhật nội dung modal
            modalBody.innerHTML = html;
            
            // Hiển thị modal
            modal.style.display = "block";
        } else {
            alert('Không thể lấy thông tin đơn hàng');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Đã có lỗi xảy ra');
    }
}

// Hàm cập nhật trạng thái đơn hàng
async function updateOrderStatus(event, orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            // Cập nhật UI
            const selectElement = event.target;
            const statusWrapper = selectElement.closest('.order__status-wrapper');
            
            // Tạo span hiển thị trạng thái mới
            const statusSpan = document.createElement('span');
            statusSpan.className = `order__status ${newStatus.toLowerCase().replace(/\s+/g, '-')}`;
            statusSpan.textContent = newStatus;
            
            // Thay thế select bằng span
            statusWrapper.innerHTML = '';
            statusWrapper.appendChild(statusSpan);
            
            // Hiển thị thông báo thành công
            alert('Cập nhật trạng thái thành công');
        } else {
            // Nếu có lỗi, reset về giá trị cũ
            event.target.value = 'Chờ xác nhận';
            alert(data.message || 'Không thể cập nhật trạng thái');
        }
    } catch (error) {
        console.error('Error:', error);
        // Reset về giá trị cũ
        event.target.value = 'Chờ xác nhận';
        alert('Đã có lỗi xảy ra khi cập nhật trạng thái');
    }
}
