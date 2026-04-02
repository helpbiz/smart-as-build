import { useState } from 'react';
import { exportApi } from '../api';

export default function Export() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportApi.downloadExcel();
    } catch (error) {
      console.error('Export error:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">엑셀 출력</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-6">
          수리 요청 데이터를 엑셀 파일로 다운로드할 수 있습니다.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 다운로드 내용</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 전체 수리 요청 목록</li>
            <li>• 고객 정보 (이름, 연락처, 주소)</li>
            <li>• 제품 및 증상 정보</li>
            <li>• 담당 기사 정보</li>
            <li>• 수리 완료 정보 (결제 금액, 방법, 부품)</li>
          </ul>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              다운로드 중...
            </>
          ) : (
            <>
              <span className="mr-2">📥</span>
              엑셀 다운로드
            </>
          )}
        </button>
      </div>
    </div>
  );
}
