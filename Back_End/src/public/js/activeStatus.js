const statusCurrent = document.querySelector('.product__selected');
const statusContainer = document.querySelector('.product__option-container');
const optionList = document.querySelectorAll('.product__option');

statusCurrent.addEventListener('click', () => {
    statusContainer.classList.toggle('active');
});


optionList.forEach(option => {
    option.addEventListener('click', () => {
        const selectedStatus = option.querySelector("label").innerHTML;

        // Đổi nội dung của statusCurrent
        statusCurrent.innerHTML = selectedStatus;

        // Đổi màu nền dựa trên trạng thái
        if (selectedStatus === "Active") {
            statusCurrent.style.backgroundColor = "green";
        } else if (selectedStatus === "Inactive") {
            statusCurrent.style.backgroundColor = "red";
        }

        // Ẩn container và xóa class 'active' khỏi các option
        statusContainer.classList.remove('active');
        optionList.forEach(option => option.classList.remove('active'));
    });
});