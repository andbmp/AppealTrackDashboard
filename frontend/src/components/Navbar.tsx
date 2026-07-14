import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from './Sidebar';

export function Navbar() {
  const role = useAuthStore(state => state.role);
  const location = useLocation();
  const currentItem = NAV_ITEMS.find(item => item.path === location.pathname);
  return (
    <header className='flex items-center justify-between px-6 h-12 border-b border-border bg-[#0b1525]'>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'><span>Sistem Appeal</span><ChevronRight size={11} /><span className='text-foreground'>{currentItem?.label || 'Halaman'}</span></div>
      <div className='flex items-center gap-4'><div className='text-sm text-foreground'>{role}</div></div>
    </header>
  );
}
