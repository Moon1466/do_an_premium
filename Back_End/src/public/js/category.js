window.parentCategoryIdToEdit = null;
window.subCategoryIdToEdit = null;

// Thêm danh mục
document.addEventListener("DOMContentLoaded", () => {
  const addCategoryButton = document.getElementById("addCategory");
  const modal = document.getElementById("addCategoryModal");
  const closeModal = document.getElementById("closeModal");

  if (addCategoryButton && modal && closeModal) {
    addCategoryButton.addEventListener("click", () => {
      modal.style.display = "flex";
    });

    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  const addCategoryForm = document.getElementById("addCategoryForm");
  if (addCategoryForm) {
    addCategoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(addCategoryForm);
      const data = Object.fromEntries(formData.entries());

      // Kiểm tra và xử lý trường parent
      if (!data.parent) {
        delete data.parent; // Xóa trường parent nếu không có giá trị
      }

      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          alert("Danh mục đã được thêm thành công!");
          location.reload();
        } else {
          const error = await response.json();
          alert(`Lỗi: ${error.message}`);
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Đã xảy ra lỗi khi thêm danh mục.");
      }
    });
  }
});

// Xóa danh mục cha
document.addEventListener("DOMContentLoaded", () => {
  const deleteParentButtons = document.querySelectorAll(".btn--delete-parent");
  const deleteModal = document.getElementById("deleteCategoryModal");
  const closeDeleteModal = document.getElementById("closeDeleteModal");
  const confirmDeleteButton = document.getElementById("confirmDelete");
  const cancelDeleteButton = document.getElementById("cancelDelete");
  let parentCategoryIdToDelete = null;

  deleteParentButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      parentCategoryIdToDelete = button.dataset.parentId;
      if (!parentCategoryIdToDelete) {
        alert("Không tìm thấy ID danh mục cha để xóa.");
        return;
      }
      deleteModal.style.display = "flex";
    });
  });

  if (closeDeleteModal) {
    closeDeleteModal.addEventListener("click", () => {
      deleteModal.style.display = "none";
    });
  }
  if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener("click", () => {
      deleteModal.style.display = "none";
    });
  }
  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", async () => {
      if (!parentCategoryIdToDelete) return;
      try {
        const response = await fetch(`/api/categories/${parentCategoryIdToDelete}`, {
          method: "DELETE",
        });
        if (response.ok) {
          alert("Danh mục cha đã được xóa thành công!");
          location.reload();
        } else {
          const error = await response.json();
          alert(`Lỗi: ${error.message}`);
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Đã xảy ra lỗi khi xóa danh mục cha.");
      } finally {
        deleteModal.style.display = "none";
      }
    });
  }
});

const confirmDeleteButton = document.getElementById("confirmDelete");
if (confirmDeleteButton) {
  confirmDeleteButton.addEventListener("click", async () => {
    const parentCategoryIdToDelete = window.parentCategoryIdToDelete;
    if (!parentCategoryIdToDelete) return;
    try {
      const response = await fetch(`/api/categories/${parentCategoryIdToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Danh mục cha đã được xóa thành công!");
        location.reload();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Đã xảy ra lỗi khi xóa danh mục cha.");
    } finally {
      document.getElementById("deleteCategoryModal").style.display = "none";
      window.parentCategoryIdToDelete = null;
    }
  });
}

// Sửa danh mục cha
document.addEventListener("DOMContentLoaded", () => {
  const editParentButtons = document.querySelectorAll(".btn--edit-parent");
  editParentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const parentCategoryId = button.dataset.parentId;
      const parentCategoryName = button.dataset.parentName;
      if (!parentCategoryId) {
        alert("Không tìm thấy ID danh mục cha để sửa.");
        return;
      }
      window.parentCategoryIdToEdit = parentCategoryId;
      window.subCategoryIdToEdit = null;
      document.getElementById("editCategoryName").value = parentCategoryName || "";
      // Nếu có trường chọn cha thì set về rỗng
      if (document.getElementById("editParentCategory")) {
        document.getElementById("editParentCategory").value = "";
      }
      document.getElementById("editCategoryModal").style.display = "flex";
    });
  });
});

// Sửa danh mục con
function handleEditSubCategory(subCategory) {
  const editModal = document.getElementById("editCategoryModal");
  const editCategoryName = document.getElementById("editCategoryName");
  if (!editModal || !editCategoryName) {
    console.error("Một hoặc nhiều phần tử DOM không tồn tại.");
    return;
  }
  window.subCategoryIdToEdit = subCategory._id;
  window.parentCategoryIdToEdit = null;
  editCategoryName.value = subCategory.name;
  // Nếu có trường slug thì set đúng slug của subCategory
  if (document.getElementById("editCategorySlug")) {
    document.getElementById("editCategorySlug").value = subCategory.slug || "";
  }
  if (document.getElementById("editParentCategory")) {
    document.getElementById("editParentCategory").value = subCategory.parent || "";
  }
  editModal.style.display = "flex";
}

// Xóa danh mục con
function handleDeleteSubCategory(subCategory) {
  const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa danh mục con "${subCategory.name}" không?`);
  if (!confirmDelete) return;
  fetch(`/api/categories/${subCategory._id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.ok) {
        alert("Danh mục con đã được xóa thành công!");
        location.reload();
      } else {
        return response.json().then((error) => {
          alert(`Lỗi: ${error.message}`);
        });
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("Đã xảy ra lỗi khi xóa danh mục con.");
    });
}

// Submit form sửa danh mục
document.getElementById("editCategoryForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  let categoryIdToEdit = null;
  if (window.subCategoryIdToEdit) {
    categoryIdToEdit = window.subCategoryIdToEdit;
  } else if (window.parentCategoryIdToEdit) {
    categoryIdToEdit = window.parentCategoryIdToEdit;
  }
  if (!categoryIdToEdit) {
    alert("Không tìm thấy ID danh mục để sửa.");
    return;
  }
  try {
    const response = await fetch(`/api/categories/${categoryIdToEdit}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      alert("Danh mục đã được cập nhật thành công!");
      location.reload();
    } else {
      const error = await response.json();
      alert(`Lỗi: ${error.message}`);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Đã xảy ra lỗi khi cập nhật danh mục.");
  }
});

// Đóng modal sửa
const closeEditModal = document.getElementById("closeEditModal");
if (closeEditModal) {
  closeEditModal.addEventListener("click", () => {
    document.getElementById("editCategoryModal").style.display = "none";
    window.parentCategoryIdToEdit = null;
    window.subCategoryIdToEdit = null;
  });
}

// Xem chi tiết danh mục và danh mục con (modal view)
document.addEventListener("DOMContentLoaded", () => {
  const viewButtons = document.querySelectorAll(".category-item__act--view");
  const viewModal = document.getElementById("viewCategoryModal");
  const closeViewButton = document.getElementById("closeViewButton");
  const viewCategoryName = document.getElementById("viewCategoryName");
  const viewSubCategoryCount = document.getElementById("viewSubCategoryCount");
  const viewSubCategoriesList = document.getElementById("viewSubCategoriesList");

  viewButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const categoryId = button.dataset.categoryId;
      if (!categoryId) {
        alert("Không tìm thấy ID danh mục.");
        return;
      }
      try {
        const response = await fetch(`/api/categories/${categoryId}`);
        if (!response.ok) throw new Error("Không thể lấy thông tin danh mục");
        const category = await response.json();
        viewCategoryName.textContent = category.name;
        viewSubCategoryCount.textContent = category.subCategories.length || 0;
        viewSubCategoriesList.innerHTML = "";
        category.subCategories.forEach((subCategory) => {
          const li = document.createElement("li");
          li.classList.add("modal-category__item");
          const span = document.createElement("span");
          span.classList.add("modal-category__label");
          span.textContent = subCategory.name;
          const actionsDiv = document.createElement("div");
          actionsDiv.classList.add("modal-category__act");
          // Nút sửa con
          const editButton = document.createElement("button");
          editButton.classList.add("btn", "btn--edit-sub");
          editButton.innerHTML = '<img src="/images/icons/edit.svg" alt="" class="icon" />';
          editButton.addEventListener("click", () => {
            handleEditSubCategory(subCategory);
          });
          // Nút xóa
          const deleteButton = document.createElement("button");
          deleteButton.classList.add("btn", "btn--delete-sub");
          deleteButton.dataset.subId = subCategory._id;
          deleteButton.dataset.subName = subCategory.name;
          deleteButton.innerHTML = '<img src="/images/icons/delete.svg" alt="Xóa" />';
          deleteButton.addEventListener("click", () => {
            handleDeleteSubCategory(subCategory);
          });
          actionsDiv.appendChild(editButton);
          actionsDiv.appendChild(deleteButton);
          li.appendChild(span);
          li.appendChild(actionsDiv);
          viewSubCategoriesList.appendChild(li);
        });

        // Sau khi fetch xong category và render danh mục con:
        const subCount = category.subCategories.length || 0;
        const title = document.getElementById("viewSubCategoriesTitle");
        if (title) {
          title.style.display = subCount > 0 ? "block" : "none";
        }

        // Cập nhật lại thuộc tính cho nút sửa/xóa cha trong modal
        const editParentBtn = document.querySelector("#viewCategoryModal .btn--edit-parent");
        const deleteParentBtn = document.querySelector("#viewCategoryModal .btn--delete-parent");
        if (editParentBtn) {
          editParentBtn.dataset.parentId = category._id;
          editParentBtn.dataset.parentName = category.name;
        }
        if (deleteParentBtn) {
          deleteParentBtn.dataset.parentId = category._id;
          deleteParentBtn.dataset.parentName = category.name;
        }

        // Gán lại data cho nút sửa/xóa trong modal xem chi tiết
        const editCategoryButton = document.getElementById("editCategoryButton");
        if (editCategoryButton) {
          editCategoryButton.dataset.parentId = category._id;
          editCategoryButton.dataset.parentName = category.name;
        }
        const deleteCategoryButton = document.getElementById("deleteCategoryButton");
        if (deleteCategoryButton) {
          deleteCategoryButton.dataset.parentId = category._id;
          deleteCategoryButton.dataset.parentName = category.name;
        }

        viewModal.style.display = "flex";
      } catch (err) {
        console.error("Error fetching category details:", err);
        alert("Đã xảy ra lỗi khi lấy thông tin danh mục.");
      }
    });
  });

  if (closeViewButton) {
    closeViewButton.addEventListener("click", () => {
      viewModal.style.display = "none";
    });
  }
  window.addEventListener("click", (event) => {
    if (event.target === viewModal) {
      viewModal.style.display = "none";
    }
  });

  // Sửa danh mục cha trong modal xem chi tiết
  const editParentBtn = document.querySelector("#viewCategoryModal .btn--edit-parent");
  if (editParentBtn) {
    editParentBtn.addEventListener("click", () => {
      const parentCategoryId = editParentBtn.dataset.parentId;
      const parentCategoryName = editParentBtn.dataset.parentName;
      if (!parentCategoryId) {
        alert("Không tìm thấy ID danh mục cha để sửa.");
        return;
      }
      window.parentCategoryIdToEdit = parentCategoryId;
      window.subCategoryIdToEdit = null;
      document.getElementById("editCategoryName").value = parentCategoryName || "";
      document.getElementById("editCategoryModal").style.display = "flex";
    });
  }

  // Xóa danh mục cha trong modal xem chi tiết
  const deleteParentBtn = document.querySelector("#viewCategoryModal .btn--delete-parent");
  if (deleteParentBtn) {
    deleteParentBtn.addEventListener("click", () => {
      const parentCategoryId = deleteParentBtn.dataset.parentId;
      if (!parentCategoryId) {
        alert("Không tìm thấy ID danh mục cha để xóa.");
        return;
      }
      // Hiển thị modal xác nhận xóa
      const deleteModal = document.getElementById("deleteCategoryModal");
      deleteModal.style.display = "flex";
      // Lưu lại ID để xác nhận xóa
      window.parentCategoryIdToDelete = parentCategoryId;
    });
  }
});

const editCategoryButton = document.getElementById("editCategoryButton");
if (editCategoryButton) {
  editCategoryButton.addEventListener("click", () => {
    const parentCategoryId = editCategoryButton.dataset.parentId;
    const parentCategoryName = editCategoryButton.dataset.parentName;
    if (!parentCategoryId) {
      alert("Không tìm thấy ID danh mục cha để sửa.");
      return;
    }
    window.parentCategoryIdToEdit = parentCategoryId;
    window.subCategoryIdToEdit = null;
    document.getElementById("editCategoryName").value = parentCategoryName || "";
    document.getElementById("editCategoryModal").style.display = "flex";
  });
}

const deleteCategoryButton = document.getElementById("deleteCategoryButton");
if (deleteCategoryButton) {
  deleteCategoryButton.addEventListener("click", async () => {
    const parentCategoryId = deleteCategoryButton.dataset.parentId;
    if (!parentCategoryId) {
      alert("Không tìm thấy ID danh mục cha để xóa.");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này không?")) return;
    try {
      const response = await fetch(`/api/categories/${parentCategoryId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Xóa danh mục thành công!");
        location.reload();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi xóa danh mục.");
    }
  });
}

const closeViewModal = document.getElementById("closeViewModal");
if (closeViewModal) {
  closeViewModal.addEventListener("click", () => {
    document.getElementById("viewCategoryModal").style.display = "none";
  });
}

