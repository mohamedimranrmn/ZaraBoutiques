// config/axios.js
import axios from 'axios';

export const axiosi = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Optional: Add request/response interceptors for debugging
axiosi.interceptors.request.use(
    (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

axiosi.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);