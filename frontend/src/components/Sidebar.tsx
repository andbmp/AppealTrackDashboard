import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload as UploadIcon, 
  Trophy, 
  List, 
  Settings as SettingsIcon, 
  User, 
  LogOut,
  BarChart2,
  Users
} from 'lucide-react';

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

export function Sidebar({ auth, handleLogout }: { auth: any, handleLogout: () => void }) {
  const location = useLocation();

  // Role-based menu generation
  const menus = [
    { label: 'Dashboard Appeal', to: '/', icon: LayoutDashboard, roles: ['Admin', 'Manajemen', 'Staff'] },
    { label: 'Upload Data', to: '/upload', icon: UploadIcon, roles: ['Admin', 'Staff'] },
    { label: 'Analisis Data & Statistik', to: '/analytics', icon: BarChart2, roles: ['Admin', 'Manajemen', 'Staff'] },
    { label: 'Ranking', to: '/ranking', icon: Trophy, roles: ['Admin', 'Manajemen', 'Staff'] },
    { label: 'Log Aktivitas', to: '/log', icon: List, roles: ['Admin', 'Manajemen', 'Staff'] },
    { label: 'Kelola Pengguna', to: '/kelola-user', icon: Users, roles: ['Admin'] },
    { label: 'Settings', to: '/admin', icon: SettingsIcon, roles: ['Admin'] },
  ];

  const allowedMenus = menus.filter(menu => menu.roles.includes(auth.role));

  return (
    <aside className="w-64 bg-[#E32636] flex flex-col shadow-lg z-20 hidden md:flex">
      <div className="flex items-center px-6 py-6 border-b border-red-500/30">
        <div className="text-white font-bold text-xl leading-tight tracking-wide">Dashboard<br/>Appeal PJP</div>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        {allowedMenus.map((menu, idx) => (
          <SidebarItem 
            key={idx}
            icon={menu.icon} 
            label={menu.label} 
            to={menu.to} 
            active={location.pathname === menu.to} 
          />
        ))}
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
  );
}
