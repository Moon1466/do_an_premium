const axios = require('axios');

const getProvinces = async (req, res) => {
    console.log('=== GET /api/address/provinces ===');
    try {
        console.log('Fetching provinces from external API...');
        const response = await axios.get('https://provinces.open-api.vn/api/p/');
        console.log('External API response status:', response.status);
        console.log('Number of provinces received:', response.data.length);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching provinces:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
        }
        res.status(500).json({ error: 'Không thể lấy danh sách tỉnh thành' });
    }
};

const getDistrictsByProvince = async (req, res) => {
    const provinceCode = req.params.provinceCode;
    console.log('=== GET /api/address/provinces/:provinceCode/districts ===');
    console.log('Province code:', provinceCode);
    
    try {
        console.log('Fetching districts from external API...');
        const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        console.log('External API response status:', response.status);
        console.log('Number of districts received:', response.data.districts?.length || 0);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching districts:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
        }
        res.status(500).json({ error: 'Không thể lấy danh sách quận huyện' });
    }
};

const getWardsByDistrict = async (req, res) => {
    const districtCode = req.params.districtCode;
    console.log('=== GET /api/address/districts/:districtCode/wards ===');
    console.log('District code:', districtCode);
    
    try {
        console.log('Fetching wards from external API...');
        const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        console.log('External API response status:', response.status);
        console.log('Number of wards received:', response.data.wards?.length || 0);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching wards:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
        }
        res.status(500).json({ error: 'Không thể lấy danh sách phường xã' });
    }
};

module.exports = {
    getProvinces,
    getDistrictsByProvince,
    getWardsByDistrict
}; 