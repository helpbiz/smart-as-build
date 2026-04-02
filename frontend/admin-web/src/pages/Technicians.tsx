import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { technicianApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import type { Technician } from '../types';

export default function Technicians() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', service_area: '' });

  const { data: technicians, isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => (await technicianApi.list()).data,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => technicianApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technicians'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => technicianApi.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technicians'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => technicianApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technicians'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => technicianApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setShowCreateModal(false);
      setForm({ name: '', phone: '', email: '', password: '', service_area: '' });
    },
  });

  if (isLoading) return <div className="text-gray-500">로딩 중...</div>;

  const techList = (technicians || []) as Technician[];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">기사 관리</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 기사 등록
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당지역</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {techList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">등록된 기사가 없습니다</td>
              </tr>
            ) : (
              techList.map((tech) => (
                <tr key={tech.id}>
                  <td className="px-6 py-4 font-medium">{tech.name}</td>
                  <td className="px-6 py-4">{tech.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tech.service_area || '-'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tech.status} type="technician" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {tech.status === 'pending' && (
                        <>
                          <button onClick={() => approveMutation.mutate(tech.id)} disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                            승인
                          </button>
                          <button onClick={() => rejectMutation.mutate(tech.id)} disabled={rejectMutation.isPending}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                            거절
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => { if (confirm(`${tech.name} 기사를 삭제하시겠습니까?`)) deleteMutation.mutate(tech.id); }}
                        disabled={deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">기사 등록</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="홍길동" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01012345678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="6자 이상" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당 지역</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.service_area}
                  onChange={e => setForm(f => ({ ...f, service_area: e.target.value }))} placeholder="서울 강남구" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="선택 입력" />
              </div>
            </div>
            {createMutation.isError && (
              <p className="text-red-500 text-sm mt-2">등록에 실패했습니다. 이미 등록된 연락처일 수 있습니다.</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.phone || !form.password}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                {createMutation.isPending ? '등록 중...' : '등록 (즉시 승인)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
