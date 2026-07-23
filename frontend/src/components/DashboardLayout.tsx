import React from 'react';
import { Search, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ auth, setAuth, children }: { auth: any, setAuth: any, children: React.ReactNode }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    navigate('/login');
  };

  if (!auth) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar auth={auth} handleLogout={handleLogout} />

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
               <span className="text-sm font-semibold text-gray-700">Halo {auth.name}</span>
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
