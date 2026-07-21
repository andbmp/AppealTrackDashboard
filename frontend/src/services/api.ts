import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const data = localStorage.getItem('auth');
  if (data) {
    try {
      const auth = JSON.parse(data);
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch (e) {}
  }
  return config;
});

export default api;
