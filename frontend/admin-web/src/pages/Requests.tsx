import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestApi, technicianApi } from '../api';
import type { RepairRequest, Technician } from '../types';

const STATUS_OPTIONS = [
  { value: 'pending', label: '대기중' },
  { value: 'assigned', label: '배정됨' },
  { value: 'repairing', label: '수리중' },
  { value: 'completed', label: '완료' },
];

export default function Requests() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ product_name: '', customer_name: '', phone: '', address: '', symptom_description: '' });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => (await requestApi.list()).data,
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => (await technicianApi.list()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => requestApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setShowCreateModal(false);
      setForm({ product_name: '', customer_name: '', phone: '', address: '', symptom_description: '' });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, techId }: { id: number; techId: number }) => requestApi.assign(id, techId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => requestApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });

  if (isLoading) return <div className="text-gray-500">로딩 중...</div>;

  const requestList = (requests || []) as RepairRequest[];
  const approvedTechs = ((technicians || []) as Technician[]).filter(t => t.status === 'approved');

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">접수 목록</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 새 접수 등록
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">기사 배정</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">접수일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requestList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">접수된 요청이 없습니다</td>
              </tr>
            ) : (
              requestList.map((req) => (
                <tr key={req.id}>
                  <td className="px-4 py-3 text-sm">{req.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{req.customer_name}</div>
                    <div className="text-sm text-gray-500">{req.phone}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{req.address}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{req.product_name}</div>
                    {req.symptom_description && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">{req.symptom_description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={req.status}
                      onChange={(e) => statusMutation.mutate({ id: req.id, status: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={req.technician?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) assignMutation.mutate({ id: req.id, techId: Number(e.target.value) });
                      }}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">{req.technician?.name || '미배정'}</option>
                      {approvedTechs.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(req.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">새 접수 등록</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">고객명 *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="홍길동" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01012345678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소 *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="서울시 강남구..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제품명 *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.product_name}
                  onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} placeholder="냉장고, 세탁기 등" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">증상 설명</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} value={form.symptom_description}
                  onChange={e => setForm(f => ({ ...f, symptom_description: e.target.value }))} placeholder="증상을 입력하세요" />
              </div>
            </div>
            {createMutation.isError && (
              <p className="text-red-500 text-sm mt-2">등록에 실패했습니다.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.customer_name || !form.phone || !form.address || !form.product_name}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {createMutation.isPending ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
