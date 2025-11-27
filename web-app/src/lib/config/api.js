// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    ENDPOINTS: {
        RESERVES: '/api/v1/reserves',
        PRICE: '/api/v1/price', 
        STATUS: '/api/v1/status',
        MINT: '/api/v1/mint',
        BURN: '/api/v1/burn'
    }
};

export const getApiUrl = (endpoint) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};