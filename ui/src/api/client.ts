import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api', // Proxy via NGINX in production
  timeout: 10000,
});
