import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Helper to set the token for all requests
export const setAuthToken = (getToken) => {
  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

export const fetchItems = () => api.get('/items');
export const searchItems = (query) => api.get(`/items/search?q=${query}`);
export const createItem = (data) => api.post('/items', data);
export const resurfaceItems = () => api.get('/items/resurface');
export const fetchGraphData = () => api.get('/items/graph');
export const fetchRelatedItems = (id) => api.get(`/items/${id}/related`);

export default api;
