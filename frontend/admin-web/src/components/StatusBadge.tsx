interface StatusBadgeProps {
  status: string;
  type: 'technician' | 'request';
}

const technicianStatusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: '대기중', class: 'bg-orange-100 text-orange-800' },
  approved: { label: '승인됨', class: 'bg-green-100 text-green-800' },
  suspended: { label: '정지됨', class: 'bg-red-100 text-red-800' },
  rejected: { label: '거절됨', class: 'bg-red-100 text-red-800' },
};

const requestStatusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: '대기중', class: 'bg-gray-100 text-gray-800' },
  assigned: { label: '배정됨', class: 'bg-blue-100 text-blue-800' },
  repairing: { label: '수리중', class: 'bg-orange-100 text-orange-800' },
  completed: { label: '완료', class: 'bg-green-100 text-green-800' },
};

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = type === 'technician' 
    ? technicianStatusConfig[status] 
    : requestStatusConfig[status];

  const defaultConfig = { label: status, class: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.class || defaultConfig.class}`}>
      {config?.label || defaultConfig.label}
    </span>
  );
}
