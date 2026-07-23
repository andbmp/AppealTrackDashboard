import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, AlertCircle, CheckCircle2, Trash2, Power } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function KelolaUser({ auth }: { auth: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setUsers(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await axios.post('http://localhost:5000/api/users', 
        { name, email, password, role },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setSuccessMsg('Pengguna berhasil ditambahkan!');
      setName('');
      setEmail('');
      setPassword('');
      setRole('Staff');
      fetchUsers(); // Refresh data
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menambahkan pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Peringatan: Apakah Anda yakin ingin menghapus permanen pengguna "${name}"?`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus pengguna');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
             <Users className="text-[#E32636]" /> Kelola Pengguna
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manajemen akun karyawan untuk akses aplikasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Pengguna */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-800">
              <UserPlus size={20} className="text-[#E32636]" /> Tambah Pengguna
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-start gap-2 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Nama Lengkap</label>
                <input 
                  type="text" required
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  placeholder="Masukkan nama"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Email</label>
                <input 
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  placeholder="email@perusahaan.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
                <input 
                  type="password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Role (Hak Akses)</label>
                <select 
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manajemen">Manajemen</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-[#E32636] text-white py-2.5 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70 mt-2"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Daftar Pengguna */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Daftar Pengguna Sistem</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nama / Email</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Tgl Dibuat</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">Memuat data...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">Belum ada data pengguna</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'Manajemen' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(u.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleToggleStatus(u.id)}
                              className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
                              title={u.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            >
                              <Power size={16} className={u.is_active ? "text-amber-500" : "text-emerald-500"} />
                            </button>
                            <button 
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Hapus Permanen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
