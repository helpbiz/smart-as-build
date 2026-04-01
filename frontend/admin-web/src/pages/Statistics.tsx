import { useEffect, useState } from 'react';
import api from '../api';
import type { Statistics } from '../types';

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    api.get('/admin/statistics')
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
    return <div className="text-gray-500">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">오류: {error}</div>;
  }

  const statistics = (stats || {
    total_revenue: 0,
    monthly_revenue: [],
    technician_stats: [],
  }) as Statistics;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">정산/통계</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">총 매출</h2>
        <p className="text-3xl font-bold text-green-600">
          {formatCurrency(statistics.total_revenue)}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">월별 매출</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">월</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">건수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {statistics.monthly_revenue.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              statistics.monthly_revenue.map((month) => (
                <tr key={month.month}>
                  <td className="px-6 py-4">{month.month}</td>
                  <td className="px-6 py-4">{formatCurrency(month.revenue)}</td>
                  <td className="px-6 py-4">{month.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">기사별 실적</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기사명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 작업</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 매출</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {statistics.technician_stats.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              statistics.technician_stats.map((tech) => (
                <tr key={tech.technician_id}>
                  <td className="px-6 py-4">{tech.technician_name}</td>
                  <td className="px-6 py-4">{tech.total_jobs}</td>
                  <td className="px-6 py-4">{formatCurrency(tech.total_revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
