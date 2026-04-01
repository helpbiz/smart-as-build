import { useState } from 'react';
import { authApi } from '../api';

export default function DebugLogin() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState('');

  const testFetch = async () => {
    setLoading('fetch');
    setResult('Fetching...');
    try {
      const res = await fetch('/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const data = await res.json();
      setResult({ method: 'fetch', status: res.status, data });
    } catch (e: any) {
      setResult({ method: 'fetch', error: e.message });
    }
    setLoading('');
  };

  const testAxios = async () => {
    setLoading('axios');
    setResult('Testing axios...');
    try {
      const res = await authApi.login('admin', 'admin123');
      setResult({ method: 'axios', status: res.status, data: res.data });
    } catch (e: any) {
      console.error('Axios error:', e);
      setResult({ 
        method: 'axios', 
        error: e.message,
        status: e.response?.status,
        data: e.response?.data,
        fullError: e.toJSON()
      });
    }
    setLoading('');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔧 API Debug Test</h2>
      <p><strong>Endpoint:</strong> POST /api/v1/admin/login</p>
      <p><strong>Body:</strong> {"{ username: 'admin', password: 'admin123' }"}</p>
      <br />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={testFetch} disabled={!!loading}>
          {loading === 'fetch' ? '...' : 'Test fetch'}
        </button>
        <button onClick={testAxios} disabled={!!loading}>
          {loading === 'axios' ? '...' : 'Test axios (same as Login page)'}
        </button>
      </div>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxWidth: '800px', overflow: 'auto', fontSize: '12px' }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
