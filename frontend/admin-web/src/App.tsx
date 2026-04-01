import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import DebugLogin from './pages/DebugLogin';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import Requests from './pages/Requests';
import Statistics from './pages/Statistics';
import Export from './pages/Export';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/d" element={<DebugLogin />} />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/technicians" element={<Technicians />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/export" element={<Export />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
