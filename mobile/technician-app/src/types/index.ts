import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) {
    return extra.apiUrl;
  }
  return 'https://api.foryouelec.co.kr/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export interface Technician {
  id: number;
  phone: string;
  name: string;
  email?: string;
  status: 'pending' | 'approved' | 'suspended';
  service_area?: string;
  latitude: number;
  longitude: number;
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
  latitude: number;
  longitude: number;
  symptom_description: string;
  symptom_photos: string;
  status: 'pending' | 'assigned' | 'repairing' | 'completed';
  accepted_at?: string;
  created_at: string;
  technician?: Technician;
  user?: User;
  repair_completion?: RepairCompletion;
}

export interface User {
  id: number;
  phone: string;
  name: string;
  email?: string;
}

export interface RepairCompletion {
  id: number;
  repair_request_id: number;
  technician_id: number;
  repair_details: string;
  parts_used: string;
  payment_amount: number;
  payment_method: 'card' | 'cash' | 'transfer';
  completion_photos: string;
  completed_at: string;
}

export interface AuthResponse {
  token: string;
  user: Technician;
}

export interface CompleteRepairRequest {
  repair_details: string;
  parts_used: string;
  payment_amount: number;
  payment_method: 'card' | 'cash' | 'transfer';
  completion_photos?: string[];
}
