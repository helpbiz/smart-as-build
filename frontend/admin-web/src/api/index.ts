import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/admin/login', { username, password }),
  register: (username: string, password: string) =>
    api.post('/admin/register', { username, password }),
};

export const dashboardApi = {
  getStats: () => api.get('/admin/dashboard'),
};

export const technicianApi = {
  list: () => api.get('/admin/technicians'),
  approve: (id: number) => api.put(`/admin/technicians/${id}/approve`),
};

export const requestApi = {
  list: () => api.get('/admin/repair-requests'),
};

export const statisticsApi = {
  get: () => api.get('/admin/statistics'),
};

export const exportApi = {
  downloadExcel: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/admin/export/excel`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = `smart_as_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename=(.+)/);
      if (fileNameMatch) {
        filename = fileNameMatch[1].replace(/"/g, '');
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
