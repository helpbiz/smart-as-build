import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '대시보드', icon: '📊' },
  { path: '/technicians', label: '기사 관리', icon: '🔧' },
  { path: '/requests', label: '접수 목록', icon: '📋' },
  { path: '/statistics', label: '정산/통계', icon: '📈' },
  { path: '/export', label: '엑셀 출력', icon: '📥' },
];

export default function Layout({ children, onLogout }: { children: React.ReactNode; onLogout?: () => void }) {
  const location = useLocation();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">Smart A/S</h1>
          <p className="text-sm text-gray-400">Admin Portal</p>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 hover:bg-gray-700 ${
                location.pathname === item.path ? 'bg-gray-700 border-l-4 border-blue-500' : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
