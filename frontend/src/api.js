import axios from 'axios';

// Cambia esta URL cuando despliegues el backend en un servidor real.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Las fotos de evidencia se sirven desde el backend, pero fuera del
// prefijo /api (ej: http://localhost:4000/uploads/sales/foto.jpg).
export const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('rx_token');
      localStorage.removeItem('rx_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
