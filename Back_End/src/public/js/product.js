const allChildCategories = window.childCategories || []; // Nên truyền childCategories ra window từ EJS

document.addEventListener('DOMContentLoaded', function() {
  const parentSelect = document.getElementById('parentCategory');
  const subSelect = document.getElementById('subCategory');

  parentSelect.addEventListener('change', function() {
    const parentId = this.value;
    subSelect.innerHTML = '<option value="">-- Chọn danh mục con --</option>';
    if (!parentId) return;
    allChildCategories.forEach(cat => {
      // Nếu cat.parent là ObjectId, cần so sánh bằng toString
      if (cat.parent && cat.parent.toString() === parentId) {
        const opt = document.createElement('option');
        opt.value = cat._id;
        opt.textContent = cat.name;
        subSelect.appendChild(opt);
      }
    });
  });

  let addEditor = null;
  let editEditor = null;
  
  // Khởi tạo CKEditor cho form thêm mới
  ClassicEditor
    .create(document.querySelector('#modal_addProduct #description'))
    .then(editor => {
      addEditor = editor;
    })
    .catch(error => {
      console.error('Error initializing CKEditor for add form:', error);
    });

  const addProductButton = document.getElementById("addProduct");
  const modalAddProduct = document.getElementById("modal_addProduct");
  const closeModalButton = document.getElementById("closeModal");
  const addProductForm = document.querySelector('#modal_addProduct .modal__form');

  // Mở modal thêm sản phẩm
  addProductButton?.addEventListener("click", () => {
    modalAddProduct.style.display = "block";
  });

  // Đóng modal và reset form
  closeModalButton?.addEventListener("click", () => {
    modalAddProduct.style.display = "none";
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('previewSubImages').innerHTML = '';
    addProductForm?.reset();
    if (addEditor) {
      addEditor.setData('');
    }
  });

  // Xử lý preview hình ảnh chính
  const mainImageInput = document.querySelector('#modal_addProduct input[name="images"]');
  mainImageInput?.addEventListener('change', function(e) {
    const previewImage = document.getElementById('previewImage');
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewImage.classList.add('show');
      }
      reader.readAsDataURL(this.files[0]);
    } else {
      previewImage.src = '';
      previewImage.classList.remove('show');
    }
  });

  // Xử lý preview hình ảnh phụ
  const subImagesInput = document.querySelector('#modal_addProduct input[name="subImages"]');
  subImagesInput?.addEventListener('change', function(e) {
    const previewContainer = document.getElementById('previewSubImages');
    previewContainer.innerHTML = '';
    
    if (this.files) {
      Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'preview-image-wrapper';
        const img = document.createElement('img');
        
        reader.onload = function(e) {
          let imgSrc = e.target.result.toString();
          if (imgSrc.startsWith('/images/uploads/')) {
            imgSrc = imgSrc.replace('/images/uploads/', '');
          }
          if (!imgSrc.startsWith('http')) {
            imgSrc = 'https://res.cloudinary.com/dcqyuixqu/image/upload/' + imgSrc;
          }
          img.src = imgSrc;
        }
        
        reader.readAsDataURL(file);
        imgWrapper.appendChild(img);
        previewContainer.appendChild(imgWrapper);
      });
    }
  });

  // SINGLE EVENT HANDLER FOR ADD PRODUCT FORM
  if (addProductForm) {
    addProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      let valid = true;
      const requiredFields = [
        { name: 'name', selector: 'input[name="name"]' },
        { name: 'price', selector: 'input[name="price"]' },
        { name: 'stock', selector: 'input[name="stock"]' },
        { name: 'images', selector: 'input[name="images"]' },
        { name: 'subImages', selector: 'input[name="subImages"]' }
      ];

      // Validate các trường
      requiredFields.forEach(field => {
        const input = this.querySelector(field.selector);
        let value = input.type === 'file' ? input.files.length : input.value.trim();
        let error = input.parentElement.querySelector('.error-message');
        
        if (!error) {
          error = document.createElement('div');
          error.className = 'error-message';
          error.style.color = 'red';
          error.style.fontSize = '13px';
          input.parentElement.appendChild(error);
        }
        
        if (!value) {
          input.style.border = '1px solid red';
          error.textContent = 'Trường bắt buộc';
          valid = false;
        } else {
          input.style.border = '';
          error.textContent = '';
        }
      });

      if (!valid) return;

      try {
        const formData = new FormData(this);
        
        // Lấy dữ liệu từ CKEditor một cách an toàn
        if (addEditor) {
          formData.set('description', addEditor.getData());
        }

        const response = await fetch('/api/add', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          alert('Thêm sản phẩm thành công!');
          // Reset form và preview
          this.reset();
          document.getElementById('previewImage').style.display = 'none';
          document.getElementById('previewSubImages').innerHTML = '';
          if (addEditor) {
            addEditor.setData('');
          }
          modalAddProduct.style.display = 'none';
          window.location.reload();
        } else {
          alert('Có lỗi xảy ra: ' + (data.message || ''));
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Lỗi kết nối server!');
      }
    });
  }

  // Rest of your existing code for other functionalities
  // ... existing code ...

  // Biến để theo dõi trạng thái submit và form
  let isSubmitting = false;
  let editForm = null;

  // Tách riêng hàm xử lý submit form
  async function handleEditFormSubmit(e) {
    e.preventDefault();
    const eventTarget = e.target;
  
    
    if (isSubmitting) {
      
      return;
    }
    
    isSubmitting = true;
  

    try {
      const formData = new FormData(this);
      const productId = formData.get('productId');
    
      
      if (window.editEditor) {
        formData.set('description', window.editEditor.getData());
      }
      
 
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: formData
      });
      
      const data = await response.json();
     
      
      if (data.success) {
     
        alert('Cập nhật sản phẩm thành công!');
        window.location.reload();
      } else {
         
        alert(data.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
      }
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Có lỗi khi cập nhật sản phẩm');
    } finally {
      
      isSubmitting = false;
    }
  }

  // Xử lý nút edit
  document.querySelectorAll('.edit-product').forEach(button => {
    button.addEventListener('click', async function() {
      const productId = this.getAttribute('data-product-id');
      
      const modalEdit = document.getElementById('modal_editProduct');
      editForm = document.getElementById('editProductForm');
      
      // Remove any existing submit event listeners
      if (editForm) {
        const newForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newForm, editForm);
        editForm = newForm;
        
        editForm.addEventListener('submit', handleEditFormSubmit);
      }

      // Disable tất cả các input khi mở modal
      const disableForm = () => {
        const allInputs = editForm.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
          input.disabled = true;
        });
        
        if (window.editEditor) {
          window.editEditor.isReadOnly = true;
        }
        
        const submitButton = editForm.querySelector('.modal__submit');
        if (submitButton) {
          submitButton.style.display = 'none';
        }
      };

      // Enable tất cả các input
      const enableForm = () => {
        const allInputs = editForm.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
          input.disabled = false;
        });
        
        if (window.editEditor) {
          window.editEditor.isReadOnly = false;
        }
        
        const submitButton = editForm.querySelector('.modal__submit');
        if (submitButton) {
          submitButton.style.display = 'block';
        }
        
        const modalTitle = modalEdit.querySelector('.modal__title');
        if (modalTitle) {
          modalTitle.textContent = 'Sửa sản phẩm';
        }
      };

      // Xử lý nút edit trong modal
      const editButton = modalEdit.querySelector('.modal__edit');
      if (editButton) {
        // Xóa tất cả event listeners cũ
        const newEditButton = editButton.cloneNode(true);
        editButton.parentNode.replaceChild(newEditButton, editButton);
        
        // Thêm event listener mới
        newEditButton.addEventListener('click', function() {
          enableForm();
          this.classList.add('hidden');
        });
      }
      
      try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
          const product = data.data;
          const categories = data.categories || [];  // Add default empty array if categories is undefined
          
          // Điền thông tin vào form
          editForm.querySelector('input[name="productId"]').value = product._id;
          editForm.querySelector('input[name="name"]').value = product.name;
          editForm.querySelector('input[name="price"]').value = product.price;
          editForm.querySelector('input[name="stock"]').value = product.stock;
          editForm.querySelector('select[name="isSale"]').value = product.isSale.toString();
          editForm.querySelector('input[name="sale"]').value = product.sale || '';
          editForm.querySelector('input[name="supplier"]').value = product.supplier || '';
          editForm.querySelector('input[name="publisher"]').value = product.publisher || '';
          editForm.querySelector('input[name="type"]').value = product.type || '';
          editForm.querySelector('input[name="author"]').value = product.author || '';
          editForm.querySelector(`input[name="active"][value="${product.active}"]`).checked = true;

          // Xử lý danh mục cha và con
          const parentCategorySelect = editForm.querySelector('select[name="parentCategory"]');
          const childCategorySelect = editForm.querySelector('select[name="category"]');
          
          if (product.category) {
            if (product.category.parent) {
              parentCategorySelect.value = product.category.parent._id;
            }
            
            // Use window.childCategories if available, otherwise fall back to categories from the response
            const childCategories = (categories && categories.length > 0) ? categories.filter(cat => 
              cat.parent && cat.parent.toString() === parentCategorySelect.value
            ) : allChildCategories.filter(cat => 
              cat.parent && cat.parent.toString() === parentCategorySelect.value
            );
            
            childCategorySelect.innerHTML = '<option value="">-- Chọn danh mục con --</option>';
            childCategories.forEach(cat => {
              const opt = document.createElement('option');
              opt.value = cat._id;
              opt.textContent = cat.name;
              childCategorySelect.appendChild(opt);
            });
            
            childCategorySelect.value = product.category._id;
          }
          
          // Hiển thị hình ảnh chính hiện tại
          let imgSrc = product.images[0];
          if (imgSrc.startsWith('/images/uploads/')) {
            imgSrc = imgSrc.replace('/images/uploads/', '');
          }
          if (!imgSrc.startsWith('http')) {
            imgSrc = 'https://res.cloudinary.com/dcqyuixqu/image/upload/' + imgSrc;
          }
          document.getElementById('currentImage').src = imgSrc;

          // Hiển thị các hình ảnh phụ với nút xóa
          const currentSubImagesContainer = document.getElementById('currentSubImages');
          currentSubImagesContainer.innerHTML = ''; // Clear existing images
          
          if (product.subImages && product.subImages.length > 0) {
            product.subImages.forEach((imageName, index) => {
              const imgWrapper = document.createElement('div');
              imgWrapper.className = 'preview-image-wrapper';
              let imgSrc = imageName;
              if (imgSrc.startsWith('/images/uploads/')) {
                imgSrc = imgSrc.replace('/images/uploads/', '');
              }
              if (!imgSrc.startsWith('http')) {
                imgSrc = 'https://res.cloudinary.com/dcqyuixqu/image/upload/' + imgSrc;
              }
              const img = document.createElement('img');
              img.src = imgSrc;
              
              // Tạo nút xóa
              const deleteButton = document.createElement('button');
              deleteButton.type = 'button';
              deleteButton.innerHTML = 'X';
              
              // Xử lý sự kiện xóa
              deleteButton.onclick = async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
                  try {
                    const response = await axios.delete(`/api/products/${product._id}/subimage/${index}`);
                    
                    if (response.data.success) {
                      imgWrapper.remove();
                      alert('Xóa ảnh thành công!');
                    } else {
                      alert('Có lỗi khi xóa ảnh: ' + (response.data.message || 'Không xác định'));
                    }
                  } catch (error) {
                    console.error('Error deleting image:', error.response || error);
                    alert('Có lỗi khi xóa ảnh: ' + (error.response?.data?.message || error.message));
                  }
                }
              };
              
              imgWrapper.appendChild(img);
              imgWrapper.appendChild(deleteButton);
              currentSubImagesContainer.appendChild(imgWrapper);
            });
          }

          // Khởi tạo CKEditor cho form edit và set giá trị
          const descriptionElement = editForm.querySelector('#description');
          
          if (window.editEditor) {
            window.editEditor.destroy();
          }
          
          ClassicEditor
            .create(descriptionElement)
            .then(editor => {
              window.editEditor = editor;
              editor.setData(product.description || '');
              // Disable form sau khi đã load xong dữ liệu và khởi tạo editor
              disableForm();
            })
            .catch(error => {
              console.error('Error initializing CKEditor for edit form:', error);
            });

          modalEdit.style.display = 'block';
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi khi lấy thông tin sản phẩm');
      }
    });
  });

  // Đóng modal edit và cleanup
  document.getElementById('closeEditModal').addEventListener('click', function() {
    const modalEdit = document.getElementById('modal_editProduct');
    
    // Reset modal title
    const modalTitle = modalEdit.querySelector('.modal__title');
    if (modalTitle) {
      modalTitle.textContent = 'Xem chi tiết';
    }
    
    // Reset edit button visibility
    const editButton = modalEdit.querySelector('.modal__edit');
    if (editButton) {
      editButton.classList.remove('hidden');
    }

    // Disable form sau khi đóng modal
    const editForm = document.getElementById('editProductForm');
    if (editForm) {
      const allInputs = editForm.querySelectorAll('input, select, textarea');
      allInputs.forEach(input => {
        input.disabled = true;
      });
      
      const submitButton = editForm.querySelector('.modal__submit');
      if (submitButton) {
        submitButton.style.display = 'none';
      }
    }
    
    if (window.editEditor) {
      window.editEditor.destroy();
      window.editEditor = null;
    }
    
    modalEdit.style.display = 'none';
    isSubmitting = false;
    
    if (editForm) {
      editForm.removeEventListener('submit', handleEditFormSubmit);
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const isSaleSelect = document.getElementById('isSaleSelect');
  const saleInput = document.querySelector('input[name="sale"]');

  function toggleSaleInput() {
    if (isSaleSelect.value === 'true') {
      saleInput.disabled = false;
      saleInput.placeholder = "Nhập % giảm giá";
    } else {
      saleInput.disabled = true;
      saleInput.value = '';
      saleInput.placeholder = "Chỉ nhập khi giảm giá";
    }
  }

  isSaleSelect.addEventListener('change', toggleSaleInput);

  // Thiết lập trạng thái ban đầu
  toggleSaleInput();
});

document.querySelectorAll('.product__selected').forEach(selected => {
  selected.addEventListener('click', function() {
    const selectBox = this.nextElementSibling;
    if (selectBox) {
      const optionContainer = selectBox.querySelector('.product__option-container');
      if (optionContainer) {
        optionContainer.classList.toggle('show');
      }
    }
  });

  // Lấy tất cả option trong selectBox này
  const selectBox = selected.nextElementSibling;
  if (selectBox) {
    const options = selectBox.querySelectorAll('.product__option label');
    options.forEach(option => {
      option.addEventListener('click', function() {
        selected.textContent = this.textContent;
        // Ẩn option-container sau khi chọn
        const optionContainer = selectBox.querySelector('.product__option-container');
        if (optionContainer) {
          optionContainer.classList.remove('show');
        }
      });
    });
  }
});

document.querySelectorAll('.product__option input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', function() {
    const productId = this.id.split('-')[1];
    const newStatus = this.value === 'true';
    const selectedDiv = this.closest('.product__status').querySelector('.product__selected');
    const statusDiv = this.closest('.product__status');

    // Cập nhật class khi thay đổi trạng thái
    if (newStatus) {
      selectedDiv.classList.remove('product__status-inactive');
      selectedDiv.classList.add('product__status-active');
      selectedDiv.textContent = 'Active';
    } else {
      selectedDiv.classList.remove('product__status-active');
      selectedDiv.classList.add('product__status-inactive');
      selectedDiv.textContent = 'Inactive';
    }

    // Gửi request API
    fetch(`/api/products/${productId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: newStatus })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        alert(data.message || 'Có lỗi xảy ra');
        location.reload();
      }
    })
    .catch(err => {
      alert('Lỗi kết nối server');
      location.reload();
    });
  });
});

// Tự động set Inactive khi tồn kho = 0
document.querySelectorAll('.product__stock').forEach(stockElement => {
  const stock = parseInt(stockElement.textContent);
  if (stock === 0) {
    const productId = stockElement.closest('.product__body-main')
      .querySelector('.product__option input[type="radio"]').id.split('-')[1];
    const activeRadio = document.getElementById(`active-${productId}`);
    const inactiveRadio = document.getElementById(`inactive-${productId}`);
    
    activeRadio.disabled = true;
    inactiveRadio.checked = true;
    
    const statusDiv = stockElement.closest('.product__body-main').querySelector('.product__status');
    const selectedDiv = statusDiv.querySelector('.product__selected');
    
    statusDiv.classList.remove('product__status-active');
    statusDiv.classList.add('product__status-sale');
    selectedDiv.textContent = 'Inactive';
  }
});

// Xử lý xóa sản phẩm
document.querySelectorAll('.delete-product').forEach(button => {
  button.addEventListener('click', function() {
    const productId = this.getAttribute('data-product-id');
    
    // Hiển thị confirm trước khi xóa
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      // Gọi API xóa sản phẩm
      fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Nếu xóa thành công, remove phần tử khỏi DOM
          this.closest('.product__body-main').remove();
          alert('Xóa sản phẩm thành công!');
        } else {
          alert(data.message || 'Có lỗi xảy ra khi xóa sản phẩm!');
        }
      })
      .catch(err => {
        alert('Lỗi kết nối server!');
        console.error(err);
      });
    }
  });
});

// Thêm preview cho ảnh chính trong form edit
const editMainImageInput = document.querySelector('#modal_editProduct input[name="images"]');
if (editMainImageInput) {
  editMainImageInput.addEventListener('change', function(e) {
    const currentImage = document.getElementById('currentImage');
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        currentImage.src = e.target.result;
      }
      reader.readAsDataURL(this.files[0]);
    }
  });
}

// Thêm preview cho ảnh phụ trong form edit
const editSubImagesInput = document.querySelector('#modal_editProduct input[name="subImages"]');
if (editSubImagesInput) {
  editSubImagesInput.addEventListener('change', function(e) {
    const currentSubImagesContainer = document.getElementById('currentSubImages');
    
    if (this.files) {
      Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        const imgWrapper = document.createElement('div');
        imgWrapper.style.position = 'relative';
        imgWrapper.style.display = 'inline-block';
        imgWrapper.style.margin = '5px';
        
        const img = document.createElement('img');
        img.style.maxWidth = '100px';
        img.style.marginTop = '10px';
        
        // Tạo nút xóa preview
        const deletePreviewButton = document.createElement('button');
        deletePreviewButton.type = 'button';
        deletePreviewButton.innerHTML = 'X';
        deletePreviewButton.style.position = 'absolute';
        deletePreviewButton.style.top = '0';
        deletePreviewButton.style.right = '0';
        deletePreviewButton.style.backgroundColor = 'red';
        deletePreviewButton.style.color = 'white';
        deletePreviewButton.style.border = 'none';
        deletePreviewButton.style.borderRadius = '50%';
        deletePreviewButton.style.width = '20px';
        deletePreviewButton.style.height = '20px';
        deletePreviewButton.style.cursor = 'pointer';
        deletePreviewButton.style.display = 'flex';
        deletePreviewButton.style.alignItems = 'center';
        deletePreviewButton.style.justifyContent = 'center';
        deletePreviewButton.style.fontSize = '12px';
        deletePreviewButton.style.zIndex = '10';
        
        // Xử lý sự kiện xóa preview
        deletePreviewButton.onclick = function() {
          imgWrapper.remove();
        };
        
        reader.onload = function(e) {
          let imgSrc = e.target.result.toString();
          if (imgSrc.startsWith('/images/uploads/')) {
            imgSrc = imgSrc.replace('/images/uploads/', '');
          }
          if (!imgSrc.startsWith('http')) {
            imgSrc = 'https://res.cloudinary.com/dcqyuixqu/image/upload/' + imgSrc;
          }
          img.src = imgSrc;
        }
        
        reader.readAsDataURL(file);
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(deletePreviewButton);
        currentSubImagesContainer.appendChild(imgWrapper);
      });
    }
  });
}

 