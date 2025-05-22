document.addEventListener('DOMContentLoaded', function() {
    // Lấy các elements
    const addAccountBtn = document.getElementById('addaccount');
    const addModal = document.getElementById('modal_addAccount');
    const editModal = document.getElementById('modal_editAccount');
    const closeAddModal = document.getElementById('closeAddModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const addForm = document.getElementById('addAccountForm');
    const editForm = document.getElementById('editAccountForm');
    const previewAddAvatar = document.getElementById('previewAddAvatar');
    const previewEditAvatar = document.getElementById('previewEditAvatar');
    const defaultAvatarSrc = 'images/logo/logo_user_empty.png';

    // Kiểm tra xem các elements có tồn tại không
    if (!addAccountBtn || !addModal || !editModal || !closeAddModal || !closeEditModal || !addForm || !editForm) {
        throw new Error('Không tìm thấy một hoặc nhiều elements cần thiết');
    }

    // Mở modal thêm mới
    addAccountBtn.addEventListener('click', () => {
        addForm.reset();
        previewAddAvatar.src = defaultAvatarSrc;
        addModal.style.display = 'flex';
        addModal.classList.add('show');
    });

    // Mở modal sửa
    document.querySelectorAll('.account__edit-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const accountId = this.dataset.id;
            await openEditModal(accountId);
        });
    });

    // Đóng modal thêm mới
    closeAddModal.addEventListener('click', () => {
        addModal.style.display = 'none';
        addModal.classList.remove('show');
        addForm.reset();
        previewAddAvatar.src = defaultAvatarSrc;
    });

    // Đóng modal sửa
    closeEditModal.addEventListener('click', () => {
        editModal.style.display = 'none';
        editModal.classList.remove('show');
        editForm.reset();
        previewEditAvatar.src = defaultAvatarSrc;
    });

    // Đóng modal khi click ra ngoài
    window.addEventListener('click', (event) => {
        if (event.target === addModal) {
            addModal.style.display = 'none';
            addModal.classList.remove('show');
            addForm.reset();
            previewAddAvatar.src = defaultAvatarSrc;
        }
        if (event.target === editModal) {
            editModal.style.display = 'none';
            editModal.classList.remove('show');
            editForm.reset();
            previewEditAvatar.src = defaultAvatarSrc;
        }
    });

    // Preview ảnh đại diện cho modal thêm mới
    const addAvatarInput = addForm.querySelector('input[name="avatar"]');
    if (addAvatarInput) {
        addAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewAddAvatar.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                previewAddAvatar.src = defaultAvatarSrc;
            }
        });
    }

    // Preview ảnh đại diện cho modal sửa
    const editAvatarInput = editForm.querySelector('input[name="avatar"]');
    if (editAvatarInput) {
        editAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewEditAvatar.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                previewEditAvatar.src = defaultAvatarSrc;
            }
        });
    }

    // Xử lý form thêm mới
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(addForm);
            
            // Debug form data
            console.log('Form Data:', {
                username: formData.get('username'),
                email: formData.get('email'),
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                role: formData.get('role'),
                address: {
                    province: formData.get('address[province]'),
                    district: formData.get('address[district]'),
                    ward: formData.get('address[ward]'),
                    detail: formData.get('address[detail]')
                },
                avatar: formData.get('avatar')
            });

            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');

            if (!password) {
                alert('Vui lòng nhập mật khẩu!');
                return;
            }

            if (password !== confirmPassword) {
                alert('Mật khẩu không khớp!');
                return;
            }

            if (password.length < 6) {
                alert('Mật khẩu phải có ít nhất 6 ký tự!');
                return;
            }

            // Validate address fields
            const province = formData.get('address[province]');
            const district = formData.get('address[district]');
            const ward = formData.get('address[ward]');
            const city = formData.get('address[city]');
            const detail = formData.get('address[detail]');

            if (!province || !district || !ward) {
                alert('Vui lòng chọn Tỉnh/Thành phố, Quận/Huyện và Phường/Xã!');
                return;
            }

            console.log('Sending request to create account...');
            const response = await fetch('/api/account/create', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                alert('Tạo tài khoản thành công!');
                addModal.style.display = 'none';
                addModal.classList.remove('show');
                addForm.reset();
                previewAddAvatar.src = defaultAvatarSrc;
                window.location.reload();
            } else {
                alert(data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error creating account:', error);
            alert('Có lỗi xảy ra');
        }
    });

    // Xử lý form sửa
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(editForm);
            const accountId = formData.get('accountId');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');

            if (password || confirmPassword) {
                if (password !== confirmPassword) {
                    alert('Mật khẩu mới không khớp!');
                    return;
                }

                if (password.length < 6) {
                    alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
                    return;
                }
            } else {
                // Nếu không nhập mật khẩu mới, xóa các trường mật khẩu khỏi formData
                formData.delete('password');
                formData.delete('confirmPassword');
            }

            // Validate address fields
            const province = formData.get('address[province]');
            const district = formData.get('address[district]');
            const ward = formData.get('address[ward]');
            const detail = formData.get('address[detail]');

            if (!province || !district || !ward) {
                alert('Vui lòng chọn Tỉnh/Thành phố, Quận/Huyện và Phường/Xã!');
                return;
            }

            const response = await fetch(`/api/accounts/${accountId}`, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Cập nhật tài khoản thành công!');
                editModal.style.display = 'none';
                editModal.classList.remove('show');
                editForm.reset();
                previewEditAvatar.src = defaultAvatarSrc;
                window.location.reload();
            } else {
                alert(data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            alert('Có lỗi xảy ra');
        }
    });

    // Xử lý xóa tài khoản
    document.querySelectorAll('.account__delete-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const accountId = this.dataset.id;
            
            if (confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
                try {
                    const response = await fetch(`/api/accounts/${accountId}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (data.success) {
                        alert('Xóa tài khoản thành công');
                        this.closest('.account__item').remove();
                    } else {
                        alert(data.message || 'Có lỗi xảy ra khi xóa tài khoản');
                    }
                } catch (error) {
                    alert('Có lỗi xảy ra khi xóa tài khoản');
                }
            }
        });
    });

    // Hàm mở modal sửa và điền thông tin
    const openEditModal = async (accountId) => {
        try {
            console.log('Opening edit modal for account:', accountId);
            editModal.style.display = 'block';

            // Fetch account data
            const response = await fetch(`/api/accounts/${accountId}`);
            const data = await response.json();
            
            if (!data.success) {
                console.error('Failed to fetch account data:', data.message);
                editModal.style.display = 'none';
                return;
            }

            console.log('Full API Response:', data);
            const account = data.account;

            // Set basic account information using form selectors
            editForm.querySelector('[name="username"]').value = account.username || '';
            editForm.querySelector('[name="email"]').value = account.email || '';
            editForm.querySelector('[name="fullName"]').value = account.fullName || '';
            editForm.querySelector('[name="phone"]').value = account.phone || '';
            editForm.querySelector('[name="role"]').value = account.role || '';

            // Reset password fields
            editForm.querySelector('[name="password"]').value = '';
            editForm.querySelector('[name="confirmPassword"]').value = '';

            // Handle avatar display
            const avatarPreview = document.getElementById('previewEditAvatar');
            if (account.avatar) {
                avatarPreview.src = `/images/uploads/${account.avatar}`;
                avatarPreview.style.display = 'block';
            } else {
                avatarPreview.src = defaultAvatarSrc;
                avatarPreview.style.display = 'block';
            }

            // Debug address data
            console.log('Address data from API:', account.address);
            console.log('Edit form elements:', {
                provinceSelect: editForm.querySelector('select[name="address[province]"]'),
                districtSelect: editForm.querySelector('select[name="address[district]"]'),
                wardSelect: editForm.querySelector('select[name="address[ward]"]'),
                detailInput: editForm.querySelector('input[name="address[detail]"]')
            });
            
            if (account.address && 
                account.address.province && 
                account.address.district && 
                account.address.ward) {
                
                console.log('Setting address values:', {
                    province: account.address.province,
                    district: account.address.district,
                    ward: account.address.ward,
                    detail: account.address.detail
                });

                // Wait a bit to ensure modal is fully rendered
                await new Promise(resolve => setTimeout(resolve, 100));

                try {
                    await setAddressValues(
                        account.address.province,
                        account.address.district,
                        account.address.ward,
                        account.address.detail
                    );
                } catch (error) {
                    console.error('Error setting address values:', error);
                }
            } else {
                console.warn('Incomplete or missing address data:', account.address);
                // Reset address fields
                const editProvinceSelect = editForm.querySelector('select[name="address[province]"]');
                const editDistrictSelect = editForm.querySelector('select[name="address[district]"]');
                const editWardSelect = editForm.querySelector('select[name="address[ward]"]');
                const editDetailInput = editForm.querySelector('input[name="address[detail]"]');

                if (editProvinceSelect) editProvinceSelect.value = '';
                if (editDistrictSelect) editDistrictSelect.value = '';
                if (editWardSelect) editWardSelect.value = '';
                if (editDetailInput) editDetailInput.value = '';
            }

            // Store account ID for form submission
            editForm.querySelector('[name="accountId"]').value = accountId;

        } catch (error) {
            console.error('Error in openEditModal:', error);
            editModal.style.display = 'none';
        }
    };
}); 