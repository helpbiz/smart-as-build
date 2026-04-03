import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { AuthResponse, RepairRequest, CompleteRepairRequest, Technician } from '../types';

const getApiBaseUrl = () => {
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) {
    return extra.apiUrl;
  }
  return 'https://foryouelec.co.kr/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('technician');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (phone: string, password: string): Promise<{ data: AuthResponse }> => {
    const response = await api.post<AuthResponse>('/technician/login', { phone, password });
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('technician', JSON.stringify(response.data.user));
    return { data: response.data };
  },

  me: async (): Promise<{ data: Technician }> => {
    const response = await api.get<Technician>('/technician/me');
    await AsyncStorage.setItem('technician', JSON.stringify(response.data));
    return { data: response.data };
  },

  register: async (data: {
    phone: string;
    name: string;
    password: string;
    email?: string;
    service_area?: string;
  }): Promise<{ data: Technician }> => {
    const response = await api.post('/technician/register', data);
    return { data: response.data };
  },

  updateFCMToken: async (fcmToken: string): Promise<void> => {
    await api.put('/technician/fcm-token', { fcm_token: fcmToken });
  },
};

export const jobsApi = {
  list: async (): Promise<{ data: RepairRequest[] }> => {
    const response = await api.get<RepairRequest[]>('/technician/repair-requests');
    return { data: response.data };
  },

  accept: async (requestId: number): Promise<{ data: { message: string } }> => {
    const response = await api.post(`/technician/repair-requests/${requestId}/accept`);
    return { data: response.data };
  },
};

export const assignmentsApi = {
  list: async (): Promise<{ data: RepairRequest[] }> => {
    const response = await api.get<RepairRequest[]>('/technician/assignments');
    return { data: response.data };
  },

  start: async (assignmentId: number): Promise<{ data: { message: string } }> => {
    const response = await api.post(`/technician/assignments/${assignmentId}/start`);
    return { data: response.data };
  },

  complete: async (
    assignmentId: number,
    data: CompleteRepairRequest
  ): Promise<{ data: { message: string } }> => {
    const response = await api.post(`/technician/assignments/${assignmentId}/complete`, data);
    return { data: response.data };
  },
};

export default api;
