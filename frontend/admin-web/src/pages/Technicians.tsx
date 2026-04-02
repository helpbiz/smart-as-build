import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { technicianApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import type { Technician } from '../types';

export default function Technicians() {
  const queryClient = useQueryClient();

  const { data: technicians, isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await technicianApi.list();
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => technicianApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => technicianApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });

  if (isLoading) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  const techList = (technicians || []) as Technician[];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">기사 관리</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {techList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  등록된 기사가 없습니다
                </td>
              </tr>
            ) : (
              techList.map((tech) => (
                <tr key={tech.id}>
                  <td className="px-6 py-4">{tech.name}</td>
                  <td className="px-6 py-4">{tech.phone}</td>
                  <td className="px-6 py-4">{tech.email || '-'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tech.status} type="technician" />
                  </td>
                  <td className="px-6 py-4">
                    {tech.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMutation.mutate(tech.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(tech.id)}
                          disabled={rejectMutation.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
