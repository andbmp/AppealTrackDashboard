import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import Dashboard from './pages/Dashboard';
import UploadLaporan from './pages/UploadLaporan';
import Analytics from './pages/Analytics';
import Ranking from './pages/Ranking';
import Settings from './pages/Settings';
import LogAktivitas from './pages/LogAktivitas';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Router>
      <div className='flex h-screen bg-background overflow-hidden text-foreground font-sans'>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar />
          <main className='flex-1 overflow-y-auto p-5 lg:p-6'>
            <Routes>
              <Route path='/' element={<Dashboard />} />
              <Route path='/upload' element={<ProtectedRoute allowedRoles={['Staff', 'Admin']}><UploadLaporan /></ProtectedRoute>} />
              <Route path='/analitik' element={<Analytics />} />
              <Route path='/peringkat' element={<Ranking />} />
              <Route path='/konfigurasi' element={<ProtectedRoute allowedRoles={['Manajemen', 'Admin']}><Settings role='Admin' /></ProtectedRoute>} />
              <Route path='/log' element={<ProtectedRoute allowedRoles={['Admin']}><LogAktivitas /></ProtectedRoute>} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
