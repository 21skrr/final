import axios from 'axios';

// Create an axios instance with default config
const API_URL = 'http://localhost:5000/api'; // Adjust this to match your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access - clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('pmiUser');
      
      // Check if it's a deactivated account
      if (error.response.data?.message === 'Account has been deactivated') {
        // Show specific message for deactivated accounts
        console.error('Account deactivated:', error.response.data.message);
      }
      
      // Dispatch event to notify AuthContext
      window.dispatchEvent(new CustomEvent('auth:cleared'));
    }
    return Promise.reject(error);
  }
);

export default api;