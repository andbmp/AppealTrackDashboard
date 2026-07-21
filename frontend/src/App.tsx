import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Ranking from './pages/Ranking';
import LogAktivitas from './pages/LogAktivitas';
import Settings from './pages/Settings';
import { 
  LayoutDashboard, 
  Upload as UploadIcon, 
  AlertTriangle, 
  Trophy, 
  List, 
  Settings as SettingsIcon, 
  Search, 
  User, 
  LogOut,
  ShieldAlert
} from 'lucide-react';

function AuthGuard({ children, auth, allowedRoles }: { children: React.ReactNode, auth: any, allowedRoles: string[] }) {
  if (!auth) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(auth.role)) return <div className="p-6 text-red-600">Access Denied: You do not have permission to view this page.</div>;
  return <>{children}</>;
}

function SidebarItem({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 mx-4 my-1 rounded-md transition-colors ${active ? 'bg-white text-red-600 font-semibold shadow-sm' : 'text-white hover:bg-red-700'}`}
    >
      <Icon size={20} className={active ? 'text-red-600' : 'text-white'} />
      <span>{label}</span>
    </Link>
  );
}

function DashboardLayout({ auth, setAuth, children }: { auth: any, setAuth: any, children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    navigate('/login');
  };

  if (!auth) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#E32636] flex flex-col shadow-lg z-20 hidden md:flex">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-red-500/30">
          <ShieldAlert className="text-white" size={28} />
          <div className="text-white font-bold text-lg leading-tight">Appeal Tracking<br/>Dashboard</div>
        </div>
        
        <div className="flex-1 py-4 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
          {['Admin', 'Staff'].includes(auth.role) && (
            <SidebarItem icon={UploadIcon} label="Upload Data" to="/upload" active={location.pathname === '/upload'} />
          )}
          <SidebarItem icon={AlertTriangle} label="Anomaly Detection" to="/analytics" active={location.pathname === '/analytics'} />
          <SidebarItem icon={Trophy} label="Ranking" to="/ranking" active={location.pathname === '/ranking'} />
          <SidebarItem icon={List} label="Log Aktivitas" to="/log" active={location.pathname === '/log'} />
          {auth.role === 'Admin' && (
            <SidebarItem icon={SettingsIcon} label="Settings" to="/admin" active={location.pathname === '/admin'} />
          )}
        </div>

        <div className="p-4 border-t border-red-500/30">
          <div className="bg-red-700/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-white/20 p-2 rounded-full">
                <User size={20} className="text-white" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-medium text-sm truncate">{auth.name}</span>
                <span className="text-red-200 text-xs truncate">{auth.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="text-white hover:text-red-200 transition-colors p-1" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-md w-96 border border-gray-200 focus-within:border-red-400 focus-within:bg-white transition-colors">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full text-sm" />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-500 font-medium">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
               <span className="text-sm font-semibold text-gray-700">Hello, {auth.name}!</span>
               <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
                  <User size={18} className="text-red-600" />
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
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
        </Routes>
      </DashboardLayout>
    </Router>
  );
}
