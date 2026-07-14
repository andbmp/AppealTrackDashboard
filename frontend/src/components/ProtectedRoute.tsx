import React from 'react';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute({ children, allowedRoles }: any) {
  const role = useAuthStore(state => state.role);
  if (!allowedRoles.includes(role)) return <div className='p-10 text-center text-red-500'>Akses Ditolak</div>;
  return <>{children}</>;
}
