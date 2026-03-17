import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (globalThis.window !== undefined) {
    const token = localStorage.getItem('inventra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle responses: unwrap errors into plain Error with the server message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && globalThis.window !== undefined) {
      // Clear token from localStorage AND reset the Zustand persisted store
      localStorage.removeItem('inventra_token');
      localStorage.removeItem('inventra-auth');
      globalThis.window.location.href = '/auth/login';
    }
    // Unwrap server error message so callers get a readable string
    const serverMessage =
      error.response?.data?.message ?? error.message ?? 'Something went wrong.';
    return Promise.reject(new Error(serverMessage));
  },
);

export default api;
