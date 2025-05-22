const addProductButton = document.getElementById("addProduct");
const modalAddProduct = document.getElementById("modal_addProduct");
const closeModalButton = document.getElementById("closeModal");

ClassicEditor
.create(document.querySelector('#description'))
.catch(error => {
  console.error(error)
});
  
addProductButton.addEventListener("click", () => {
    console.log("Add Product button clicked");
    modalAddProduct.style.display = "block";
});

closeModalButton.addEventListener("click", () => {
    console.log("Close Modal button clicked");
    modalAddProduct.style.display = "none";
});

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.modal__form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(form);

    fetch('/product/add', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Thêm sản phẩm thành công!');
        window.location.reload();
      } else {
        alert('Có lỗi xảy ra: ' + (data.message || ''));
      }
    })
    .catch(err => {
      alert('Lỗi kết nối server!');
    });
  });
});