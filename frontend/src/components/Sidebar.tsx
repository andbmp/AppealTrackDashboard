import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UploadCloud, BarChart2, Layers, Settings, FileText, Activity, X, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const NAV_ITEMS = [
  { id: 'beranda', path: '/', label: 'Beranda', icon: Home },
  { id: 'upload', path: '/upload', label: 'Unggah Data', icon: UploadCloud },
  { id: 'analitik', path: '/analitik', label: 'Analitik', icon: BarChart2 },
  { id: 'peringkat', path: '/peringkat', label: 'Peringkat PJP', icon: Layers },
  { id: 'konfigurasi', path: '/konfigurasi', label: 'Konfigurasi', icon: Settings },
  { id: 'log', path: '/log', label: 'Log Aktivitas', icon: FileText },
];

export function Sidebar({ collapsed, setCollapsed }: any) {
  const { role, setRole } = useAuthStore();
  return (
    <aside className={`flex flex-col bg-[#0b1525] border-r border-border shrink-0 transition-all duration-200 ${!collapsed ? 'w-52' : 'w-14'}`}>
      <div className='flex items-center gap-3 px-4 h-12 border-b border-border'>
        <div className='w-7 h-7 bg-[#00d4aa] rounded flex items-center justify-center shrink-0'><Activity size={13} className='text-[#070d1a]' /></div>
        {!collapsed && <div><div className='text-sm font-bold text-foreground'>APPEAL PJP</div><div className='text-xs text-muted-foreground'>Analytics</div></div>}
      </div>
      <nav className='flex-1 py-2 space-y-0.5 overflow-y-auto'>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return <NavLink key={item.id} to={item.path} className={({isActive}) => `w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isActive ? 'text-[#00d4aa] bg-[#00d4aa]/8' : 'text-muted-foreground hover:text-foreground'}`}><Icon size={15} />{!collapsed && <span>{item.label}</span>}</NavLink>
        })}
      </nav>
      {!collapsed && <div className='p-3 border-t border-border'><select value={role} onChange={e => setRole(e.target.value)} className='w-full bg-muted text-[#00d4aa] rounded p-1'>{['Staff', 'Manajemen', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>}
      <button onClick={() => setCollapsed(!collapsed)} className='p-3 border-t border-border flex justify-center text-muted-foreground'>{!collapsed ? <X size={14}/> : <Menu size={14}/>}</button>
    </aside>
  );
}
