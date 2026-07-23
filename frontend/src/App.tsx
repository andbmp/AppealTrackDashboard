import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/UploadLaporan';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Ranking from './pages/Ranking';
import LogAktivitas from './pages/LogAktivitas';
import Settings from './pages/Settings';
import KelolaUser from './pages/KelolaUser';
import { DashboardLayout } from './components/DashboardLayout';

function AuthGuard({ children, auth, allowedRoles }: { children: React.ReactNode, auth: any, allowedRoles: string[] }) {
  if (!auth) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(auth.role)) return <div className="p-6 text-red-600">Access Denied: You do not have permission to view this page.</div>;
  return <>{children}</>;
}



export default function App() {
  const [auth, setAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) setAuth(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <Router>
      <DashboardLayout auth={auth} setAuth={setAuth}>
        <Routes>
          <Route path="/login" element={<Login setAuth={setAuth} />} />
          <Route path="/" element={<AuthGuard auth={auth} allowedRoles={['Admin', 'Manajemen', 'Staff']}><Dashboard auth={auth} /></AuthGuard>} />
          <Route path="/upload" element={<AuthGuard auth={auth} allowedRoles={['Admin', 'Staff']}><Upload auth={auth} /></AuthGuard>} />
          <Route path="/analytics" element={<AuthGuard auth={auth} allowedRoles={['Admin', 'Manajemen', 'Staff']}><Analytics auth={auth} /></AuthGuard>} />
          <Route path="/ranking" element={<AuthGuard auth={auth} allowedRoles={['Admin', 'Manajemen', 'Staff']}><Ranking auth={auth} /></AuthGuard>} />
          <Route path="/log" element={<AuthGuard auth={auth} allowedRoles={['Admin', 'Manajemen', 'Staff']}><LogAktivitas auth={auth} /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard auth={auth} allowedRoles={['Admin']}><Admin auth={auth} /></AuthGuard>} />
          <Route path="/kelola-user" element={<AuthGuard auth={auth} allowedRoles={['Admin']}><KelolaUser auth={auth} /></AuthGuard>} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}
