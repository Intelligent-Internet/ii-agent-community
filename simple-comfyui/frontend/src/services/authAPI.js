import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const response = await authAPI.post('/login', { username, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await authAPI.post('/register', userData);
  return response.data;
};

export const getCurrentUser = async (token) => {
  const response = await authAPI.get('/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getUserWorkflows = async () => {
  const response = await authAPI.get('/my-workflows');
  return response.data;
};

export const saveWorkflow = async (workflowData) => {
  const response = await authAPI.post('/save-workflow', workflowData);
  return response.data;
};

export const updateWorkflow = async (workflowId, workflowData) => {
  const response = await authAPI.put(`/update-workflow/${workflowId}`, workflowData);
  return response.data;
};

export const deleteWorkflow = async (workflowId) => {
  const response = await authAPI.delete(`/delete-workflow/${workflowId}`);
  return response.data;
};

export default authAPI;