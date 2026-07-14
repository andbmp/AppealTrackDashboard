import { create } from 'zustand';
import type { Role } from './data';
interface AuthState { role: Role; setRole: (role: Role) => void; }
export const useAuthStore = create((set) => ({
  role: 'Admin',
  setRole: (role) => set({ role }),
}));
