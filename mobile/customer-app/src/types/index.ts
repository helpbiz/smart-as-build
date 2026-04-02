export const API_BASE_URL = 'http://192.168.1.2:8088/api/v1';

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

export interface LoginResponse {
  token: string;
  user: User;
}
