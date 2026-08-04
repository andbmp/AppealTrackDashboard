import React, { useState } from 'react';
import { User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ auth, setAuth, children }: { auth: any, setAuth: any, children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    navigate('/login');
  };

  if (!auth) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar auth={auth} handleLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:block text-sm text-gray-500 font-medium">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-3 md:pl-6 md:border-l border-gray-200">
               <span className="text-sm font-semibold text-gray-700 truncate max-w-[100px] md:max-w-none">Halo {auth.name}</span>
               <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-sm bg-white flex items-center justify-center">
                  <img src="/icons-profiles.png" alt="Profile" className="w-full h-full object-cover" />
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
