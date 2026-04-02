import { useQuery } from '@tanstack/react-query';
import { requestApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import type { RepairRequest } from '../types';

export default function Requests() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const response = await requestApi.list();
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  const requestList = (requests || []) as RepairRequest[];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">접수 목록</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기사</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">접수일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requestList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  접수된 요청이 없습니다
                </td>
              </tr>
            ) : (
              requestList.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4">{req.id}</td>
                  <td className="px-6 py-4">
                    <div>{req.customer_name}</div>
                    <div className="text-sm text-gray-500">{req.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{req.product_name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{req.address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} type="request" />
                  </td>
                  <td className="px-6 py-4">
                    {req.technician?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(req.created_at)}
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
