import axios, { AxiosError } from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Handle 500 errors
    if (error.response?.status === 500) {
      const customError: any = new Error('Something went wrong. Try again later.');
      customError.response = error.response;
      return Promise.reject(customError);
    }
    // Handle 400 errors with custom messages
    if (error.response?.status === 400) {
      const message = error.response?.data?.message || 'Invalid request. Please check your input.';
      const customError: any = new Error(message);
      customError.response = error.response;
      return Promise.reject(customError);
    }
    // Handle other errors
    return Promise.reject(error);
  },
);

export const authApi = {
  setToken: setAuthToken,
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export const resumeApi = {
  upload: async (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    const formData = new FormData();
    fileList.forEach((file) => formData.append('files', file));
    const response = await api.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getAll: async (page: number = 1, limit: number = 10, search?: string, skill?: string) => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (skill) params.skill = skill;
    const response = await api.get('/resumes', { params });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/resumes/${id}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/resumes/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/resumes/stats');
    return response.data;
  },
};

export default api;

