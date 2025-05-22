 
  // Đóng modal
  document.getElementById('closeCommentModal').onclick = function() {
    document.getElementById('commentDetailModal').style.display = 'none';
  };
  document.querySelector('.modal__overlay').onclick = function() {
    document.getElementById('commentDetailModal').style.display = 'none';
  };

  // Mở modal và load chi tiết đánh giá
  document.querySelectorAll('.comment__btn-detail').forEach(btn => {
    btn.onclick = async function(e) {
      e.preventDefault();
      const productId = this.getAttribute('href').split('/').pop();
      // Gọi API lấy chi tiết đánh giá
      const res = await fetch(`/api/comments/${productId}`);
      const data = await res.json();
      if (data.success) {
        // Hiển thị tên sản phẩm
        document.getElementById('modalProductName').innerText = data.productName || 'Chi tiết đánh giá';
        // Hiển thị thống kê rating
        let statsHtml = '<div class="modal__stats">';
        for (let star = 5; star >= 1; star--) {
          const count = data.stats[star] || 0;
          statsHtml += `
            <div class="modal__stat-row">
              <span>${star}★</span>
              <div class="modal__stat-bar" style="width:${count * 20}px"></div>
              <span>${count} đánh giá</span>
            </div>
          `;
        }
        statsHtml += '</div>';
        document.getElementById('modalRatingStats').innerHTML = statsHtml;
        // Hiển thị danh sách comment
        let commentsHtml = '<div class="modal__comments">';
        if (data.comments.length === 0) {
          commentsHtml += '<div style="color:#888;">Chưa có bình luận nào.</div>';
        } else {
          data.comments.forEach(c => {
            commentsHtml += `
              <div class="modal__comment">
                <div class="modal__comment-header">
                  <strong>${c.userName}</strong> - <span>${c.rating}★</span>
                </div>
                <div class="modal__comment-body">${c.comment}</div>
              </div>
            `;
          });
        }
        commentsHtml += '</div>';
        document.getElementById('modalCommentList').innerHTML = commentsHtml;
        // Hiện modal
        document.getElementById('commentDetailModal').style.display = 'block';
      }
    }
  });
 
