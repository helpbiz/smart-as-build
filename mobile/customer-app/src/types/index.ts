import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) {
    return extra.apiUrl;
  }
  return 'https://api.foryouelec.co.kr/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export interface User {
  id: number;
  phone: string;
  name: string;
  email?: string;
}

export interface RepairRequest {
  id: number;
  user_id: number;
  technician_id?: number;
  product_name: string;
  purchase_date: string;
  customer_name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  symptom_description?: string;
  symptom_photos?: string[];
  status: 'pending' | 'assigned' | 'repairing' | 'completed';
  created_at: string;
  technician?: {
    name: string;
    phone: string;
  };
}

export interface CreateRepairRequest {
  product_name: string;
  purchase_date: string;
  customer_name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  symptom_description?: string;
  symptom_photos?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginResponse extends AuthResponse {}
