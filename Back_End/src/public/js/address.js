document.addEventListener('DOMContentLoaded', function() {
    try {
        // Debug the modal visibility first
        const addModal = document.getElementById('modal_addAccount');
        const editModal = document.getElementById('modal_editAccount');
        const addForm = document.getElementById('addAccountForm');
        const editForm = document.getElementById('editAccountForm');

        console.log('Forms found:', {
            addModal: addModal ? 'Found' : 'Not found',
            editModal: editModal ? 'Found' : 'Not found',
            addForm: addForm ? 'Found' : 'Not found',
            editForm: editForm ? 'Found' : 'Not found'
        });

        if (!addForm || !editForm) {
            throw new Error('Không tìm thấy form thêm mới hoặc form sửa');
        }
        
        // Get select elements for add form
        const addProvinceSelect = addForm.querySelector('select[name="address[province]"]');
        const addDistrictSelect = addForm.querySelector('select[name="address[district]"]');
        const addWardSelect = addForm.querySelector('select[name="address[ward]"]');

        // Get select elements for edit form
        const editProvinceSelect = editForm.querySelector('select[name="address[province]"]');
        const editDistrictSelect = editForm.querySelector('select[name="address[district]"]');
        const editWardSelect = editForm.querySelector('select[name="address[ward]"]');

        console.log('Add form selects:', {
            province: addProvinceSelect?.name,
            district: addDistrictSelect?.name,
            ward: addWardSelect?.name
        });

        console.log('Edit form selects:', {
            province: editProvinceSelect?.name,
            district: editDistrictSelect?.name,
            ward: editWardSelect?.name
        });

        // Validate elements exist
        if (!addProvinceSelect || !addDistrictSelect || !addWardSelect) {
            console.error('Missing select elements in add form:', {
                province: !addProvinceSelect,
                district: !addDistrictSelect,
                ward: !addWardSelect
            });
            throw new Error('Không tìm thấy các element select trong form thêm mới');
        }

        if (!editProvinceSelect || !editDistrictSelect || !editWardSelect) {
            console.error('Missing select elements in edit form:', {
                province: !editProvinceSelect,
                district: !editDistrictSelect,
                ward: !editWardSelect
            });
            throw new Error('Không tìm thấy các element select trong form sửa');
        }

        // Disable dependent dropdowns initially for both forms
        addDistrictSelect.disabled = true;
        addWardSelect.disabled = true;

        editDistrictSelect.disabled = true;
        editWardSelect.disabled = true;

        // Function to fetch provinces and populate select
        async function fetchAndPopulateProvinces(provinceSelect) {
            try {
                console.log('Fetching provinces for select:', provinceSelect.name);
                const response = await fetch('/api/address/provinces');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Received province data:', data);

                if (!Array.isArray(data)) {
                    throw new Error('Data is not an array');
                }

                // Sort provinces by name
                data.sort((a, b) => a.name.localeCompare(b.name));

                // Clear existing options
                provinceSelect.innerHTML = '';

                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = "Chọn Tỉnh/Thành phố";
                provinceSelect.appendChild(defaultOption);

                // Add provinces to select
                data.forEach(province => {
                    if (!province.code || !province.name) {
                        console.error('Invalid province data:', province);
                        return;
                    }

                    const option = document.createElement('option');
                    option.value = province.code;
                    option.textContent = province.name;
                    provinceSelect.appendChild(option);
                });

                console.log('Provinces loaded into select:', {
                    selectName: provinceSelect.name,
                    optionsCount: provinceSelect.options.length,
                    firstOption: provinceSelect.options[0]?.textContent,
                    lastOption: provinceSelect.options[provinceSelect.options.length - 1]?.textContent
                });

                provinceSelect.disabled = false;
                return data;
            } catch (error) {
                console.error('Error loading provinces:', error);
                provinceSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
                provinceSelect.disabled = true;
                throw error;
            }
        }

        // Function to fetch districts for a province
        async function fetchDistricts(provinceCode) {
            try {
                console.log('Fetching districts for province:', provinceCode);
                const response = await fetch(`/api/address/provinces/${provinceCode}/districts`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                
                if (!data.districts || !Array.isArray(data.districts)) {
                    throw new Error('Invalid district data');
                }

                console.log('Districts received:', data);
                return data;
            } catch (error) {
                console.error('Error fetching districts:', error);
                throw error;
            }
        }

        // Function to fetch wards for a district
        async function fetchWards(districtCode) {
            try {
                console.log('Fetching wards for district:', districtCode);
                const response = await fetch(`/api/address/districts/${districtCode}/wards`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                
                if (!data.wards || !Array.isArray(data.wards)) {
                    throw new Error('Invalid ward data');
                }

                console.log('Wards received:', data);
                return data;
            } catch (error) {
                console.error('Error fetching wards:', error);
                throw error;
            }
        }

        // Function to handle province change
        async function handleProvinceChange(provinceSelect, districtSelect, wardSelect) {
            const provinceCode = provinceSelect.value;
            console.log('Province selected:', provinceCode);
            
            if (provinceCode) {
                try {
                    const data = await fetchDistricts(provinceCode);
                    
                    // Clear and add default option
                    districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
                    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
                    
                    // Add districts
                    data.districts.forEach(district => {
                        const option = document.createElement('option');
                        option.value = district.code;
                        option.textContent = district.name;
                        districtSelect.appendChild(option);
                    });

                    districtSelect.disabled = false;
                } catch (error) {
                    console.error('Error handling province selection:', error);
                    districtSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
                    districtSelect.disabled = true;
                }
            } else {
                // Reset dependent dropdowns
                districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
                wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
                districtSelect.disabled = true;
                wardSelect.disabled = true;
            }
        }

        // Function to handle district change
        async function handleDistrictChange(districtSelect, wardSelect) {
            const districtCode = districtSelect.value;
            console.log('District selected:', districtCode);
            
            if (districtCode) {
                try {
                    const data = await fetchWards(districtCode);
                    
                    // Clear and add default option
                    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
                    
                    // Add wards
                    data.wards.forEach(ward => {
                        const option = document.createElement('option');
                        option.value = ward.code;
                        option.textContent = ward.name;
                        wardSelect.appendChild(option);
                    });

                    wardSelect.disabled = false;
                } catch (error) {
                    console.error('Error handling district selection:', error);
                    wardSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
                    wardSelect.disabled = true;
                }
            } else {
                // Reset ward select
                wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
                wardSelect.disabled = true;
            }
        }

        // Add event listeners for add form
        addProvinceSelect.addEventListener('change', () => 
            handleProvinceChange(addProvinceSelect, addDistrictSelect, addWardSelect));
        addDistrictSelect.addEventListener('change', () => 
            handleDistrictChange(addDistrictSelect, addWardSelect));

        // Add event listeners for edit form
        editProvinceSelect.addEventListener('change', () => 
            handleProvinceChange(editProvinceSelect, editDistrictSelect, editWardSelect));
        editDistrictSelect.addEventListener('change', () => 
            handleDistrictChange(editDistrictSelect, editWardSelect));

        // Initialize provinces for add form
        fetchAndPopulateProvinces(addProvinceSelect).catch(console.error);

        // Function to set address values
        async function setAddressValues(provinceCode, districtCode, wardCode, detail) {
            console.log('Setting address values:', { provinceCode, districtCode, wardCode, detail });
            
            try {
                // Load provinces first
                await fetchAndPopulateProvinces(editProvinceSelect);
                
                if (provinceCode) {
                    // Set province and trigger change event
                    editProvinceSelect.value = provinceCode;
                    await handleProvinceChange(editProvinceSelect, editDistrictSelect, editWardSelect);
                    
                    if (districtCode) {
                        // Set district and trigger change event
                        editDistrictSelect.value = districtCode;
                        await handleDistrictChange(editDistrictSelect, editWardSelect);
                        
                        if (wardCode) {
                            // Set ward
                            editWardSelect.value = wardCode;
                        }
                    }
                }
                
                // Set detail if provided
                if (detail) {
                    const detailInput = editForm.querySelector('input[name="address[detail]"]');
                    if (detailInput) {
                        detailInput.value = detail;
                    }
                }
            } catch (error) {
                console.error('Error setting address values:', error);
            }
        }

        // Export the function so it can be used in account.js
        window.setAddressValues = setAddressValues;

    } catch (error) {
        console.error('Initialization error:', error);
        throw new Error('Lỗi khởi tạo script');
    }
}); 