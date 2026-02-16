import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
    const { token } = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
