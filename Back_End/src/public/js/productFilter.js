document.addEventListener('DOMContentLoaded', function() {
  console.log('ProductFilter.js loaded');
  
  // Filter functionality
  const filterButton = document.getElementById('filterButton');
  const filterDropdown = document.getElementById('filterDropdown');
  const filterOptions = document.querySelectorAll('.product__filter-option');
  
  console.log('Elements found:', {
    filterButton: !!filterButton,
    filterDropdown: !!filterDropdown,
    filterOptionsCount: filterOptions.length
  });
  
  // Đối tượng lưu trữ trạng thái lọc hiện tại
  const filterState = {
    sort: null,
    status: null,
    sale: null
  };

  // Lưu trữ tất cả sản phẩm ban đầu
  const allProducts = Array.from(document.querySelectorAll('.product__body-main'));
  console.log('Total products found:', allProducts.length);
  
  // Hiển thị/ẩn dropdown
  filterButton.addEventListener('click', function(e) {
    console.log('Filter button clicked');
    e.stopPropagation();
    filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  // Đóng dropdown khi click ra ngoài
  document.addEventListener('click', function(e) {
    if (!filterDropdown.contains(e.target) && e.target !== filterButton) {
      filterDropdown.style.display = 'none';
    }
  });

  // Xử lý sự kiện click vào option
  filterOptions.forEach(option => {
    option.addEventListener('click', function() {
      console.log('Filter option clicked');
      const sortType = this.getAttribute('data-sort');
      const filterType = this.getAttribute('data-filter');
      const filterValue = this.getAttribute('data-value');
      
      // Ẩn dropdown sau khi click
      filterDropdown.style.display = 'none';
      
      console.log('Filter clicked:', { sortType, filterType, filterValue });
      
      // Reset tất cả filter trước
      filterState.sort = null;
      filterState.status = null;
      filterState.sale = null;

      // Chỉ áp dụng filter được click
      if (sortType) {
        filterState.sort = sortType;
      } else if (filterType === 'status') {
        filterState.status = filterValue;
      } else if (filterType === 'sale') {
        filterState.sale = filterValue === 'true';
      }

      console.log('Current filter state:', filterState);

      // Áp dụng filter
      applyFilters();
    });
  });

  // Hàm áp dụng tất cả bộ lọc
  function applyFilters() {
    console.log('Applying filters with state:', filterState);
    
    const productContainer = document.querySelector('.product__main');
    const headerMain = productContainer.querySelector('.product__header-main');
    
    // Xóa thông báo không có sản phẩm nếu có
    const existingEmptyMessage = document.querySelector('.product__empty');
    if (existingEmptyMessage) {
      existingEmptyMessage.remove();
    }

    // Bắt đầu với tất cả sản phẩm
    let filteredProducts = [...allProducts];
    console.log('Starting filter with products:', filteredProducts.length);

    // Áp dụng filter được chọn
    if (filterState.status !== null) {
      console.log('Applying status filter:', filterState.status);
      filteredProducts = filteredProducts.filter(product => {
        const status = product.querySelector('.product__selected').textContent.trim().toLowerCase();
        return filterState.status === 'active' ? status === 'active' : status === 'inactive';
      });
    } else if (filterState.sale !== null) {
      console.log('Applying sale filter:', filterState.sale);
      filteredProducts = filteredProducts.filter(product => {
        const saleLabel = product.querySelector('.product__sale-label').textContent.trim().toLowerCase();
        return filterState.sale ? saleLabel === 'có' : saleLabel === 'không';
      });
    } else if (filterState.sort) {
      console.log('Applying sort:', filterState.sort);
      filteredProducts.sort((a, b) => {
        const nameA = a.querySelector('.product__name').textContent.trim();
        const nameB = b.querySelector('.product__name').textContent.trim();
        
        switch(filterState.sort) {
          case 'newest':
            return -1;
          case 'oldest':
            return 1;
          case 'asc':
            return nameB.localeCompare(nameA, 'vi');
          case 'desc':
            return nameA.localeCompare(nameB, 'vi');
          default:
            return 0;
        }
      });
    }

    console.log('Final filtered products count:', filteredProducts.length);

    // Xóa tất cả sản phẩm hiện tại
    allProducts.forEach(product => {
      if (product.parentNode) {
        product.parentNode.removeChild(product);
      }
    });

    // Hiển thị kết quả
    if (filteredProducts.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'product__empty';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '40px';
      emptyMessage.style.color = '#666';
      emptyMessage.style.fontSize = '16px';
      emptyMessage.style.background = '#f8f9fa';
      emptyMessage.style.borderRadius = '8px';
      emptyMessage.style.margin = '20px 0';
      emptyMessage.innerHTML = `
        <img src="images/icons/product_not_found.png" alt="No products" style="width: 64px; height: 64px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 1.2rem; font-weight: 400; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.1rem;">Không tìm thấy sản phẩm phù hợp với bộ lọc</p>
      `;
      headerMain.after(emptyMessage);
    } else {
      filteredProducts.forEach(product => {
        headerMain.after(product);
      });
    }
  }
}); 