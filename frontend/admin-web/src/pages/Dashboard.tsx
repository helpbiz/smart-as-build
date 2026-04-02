import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import api from '../api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    today_requests: number;
    today_assigned: number;
    today_completed: number;
    pending_requests: number;
    total_technicians: number;
    approved_technicians: number;
  } | null>(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        오류: {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        데이터 없음
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="금일 접수"
          value={stats.today_requests}
          icon="📝"
          color="blue"
        />
        <StatCard
          title="금일 배정"
          value={stats.today_assigned}
          icon="📌"
          color="purple"
        />
        <StatCard
          title="금일 완료"
          value={stats.today_completed}
          icon="✅"
          color="green"
        />
        <StatCard
          title="대기 중인 접수"
          value={stats.pending_requests}
          icon="⏳"
          color="orange"
        />
        <StatCard
          title="총 기사 수"
          value={stats.total_technicians}
          icon="👨‍🔧"
          color="blue"
        />
        <StatCard
          title="승인된 기사"
          value={stats.approved_technicians}
          icon="✓"
          color="green"
        />
      </div>
    </div>
  );
}
