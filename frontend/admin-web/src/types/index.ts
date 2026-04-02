export interface User {
  id: number;
  phone: string;
  name: string;
  email?: string;
  created_at: string;
}

export interface Technician {
  id: number;
  phone: string;
  name: string;
  email?: string;
  status: 'pending' | 'approved' | 'suspended';
  service_area?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
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
  accepted_at?: string;
  created_at: string;
  user?: User;
  technician?: Technician;
  repair_completion?: RepairCompletion;
}

export interface RepairCompletion {
  id: number;
  repair_request_id: number;
  technician_id: number;
  repair_details: string;
  parts_used?: string;
  payment_amount: number;
  payment_method: 'card' | 'cash' | 'transfer';
  completion_photos?: string[];
  completed_at: string;
}

export interface DashboardStats {
  today_requests: number;
  today_assigned: number;
  today_completed: number;
  pending_requests: number;
  total_technicians: number;
  approved_technicians: number;
}

export interface MonthlyStat {
  month: string;
  revenue: number;
  count: number;
}

export interface TechnicianStat {
  technician_id: number;
  technician_name: string;
  total_jobs: number;
  total_revenue: number;
}

export interface Statistics {
  total_revenue: number;
  monthly_revenue: MonthlyStat[];
  technician_stats: TechnicianStat[];
}

export interface AuthResponse {
  token: string;
  user: User | Technician;
}
