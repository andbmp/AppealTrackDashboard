import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CreditCard, TrendingUp, AlertOctagon, BarChart3, PieChart as PieIcon, Layers } from 'lucide-react';

// Palet warna yang lebih elegan, harmonis, dan modern (Premium Slate & Crimson tones)
const PIE_COLORS = ['#E32636', '#FCA5A5', '#F87171', '#991B1B', '#FECACA', '#7F1D1D'];

export default function Dashboard({ auth }: { auth: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => localStorage.getItem('dashboard_start') || '');
  const [endDate, setEndDate] = useState(() => localStorage.getItem('dashboard_end') || '');

  useEffect(() => {
    localStorage.setItem('dashboard_start', startDate);
    localStorage.setItem('dashboard_end', endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await axios.get(`http://localhost:5000/api/dashboard?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#E32636]"></div>
    </div>
  );
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 shadow-sm">Gagal memuat data: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center">
            Ringkasan performa appeal pendaftaran merchant PJP
            <span className="ml-3 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-bold border border-blue-100 uppercase tracking-wider">
              {startDate && endDate ? `${startDate} s/d ${endDate}` : 'Bulan Ini (30 Hari Terakhir)'}
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
           <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-md p-1 shadow-sm">
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 text-sm text-slate-700 outline-none bg-transparent" />
             <span className="text-slate-400 text-sm">s/d</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 text-sm text-slate-700 outline-none bg-transparent" />
           </div>
           <div className="flex gap-2">
             <button onClick={fetchData} className="px-4 py-2 bg-[#E32636] text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">Filter</button>
             {(startDate || endDate) && (
               <button onClick={() => { setStartDate(''); setEndDate(''); setTimeout(fetchData, 100); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors shadow-sm">Reset</button>
             )}
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md hover:border-slate-200 transition-all">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Appeal {startDate && endDate ? '' : '(Bulan Ini)'}</h2>
            <p className="text-3xl font-bold text-slate-800">{data.totalAppeal || 0}</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
              <TrendingUp size={14} /> Laporan diproses
            </p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-full group-hover:bg-emerald-100 transition-colors">
             <Layers className="text-emerald-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md hover:border-slate-200 transition-all">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total MCC {startDate && endDate ? '' : '(Bulan Ini)'}</h2>
            <p className="text-3xl font-bold text-slate-800">{data.uniqueMcc || 0}</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
              <TrendingUp size={14} /> Stabil bulan ini
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-full group-hover:bg-slate-100 transition-colors">
             <CreditCard className="text-slate-600" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FR-11: Grafik Batang Jumlah Proses Per Tanggal */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
             <BarChart3 className="text-slate-400" size={20} />
             <h2 className="font-bold text-slate-800 text-lg">Tren Jumlah Proses Harian {startDate && endDate ? '' : '(30 Hari)'}</h2>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.volumePerDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tanggal" tickFormatter={(str) => str ? str.substring(8, 10) : ''} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="volume" fill="#E32636" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FR-08: Grafik Statistik Per PJP (Status Done) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
             <PieIcon className="text-slate-400" size={20} />
             <h2 className="font-bold text-slate-800 text-lg">Distribusi PJP Status 'Done' {startDate && endDate ? '' : '(30 Hari)'}</h2>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.distributionByPjp} 
                  dataKey="count" 
                  nameKey="pjp" 
                  cx="50%" cy="50%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={2}
                >
                  {data.distributionByPjp?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Tiering List - Dirapihkan dengan desain minimalis elegan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
           <div className="flex items-center gap-2 mb-6">
              <Layers className="text-slate-400" size={20} />
              <h2 className="font-bold text-slate-800 text-lg">Klasifikasi Tier PJP (All Time)</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tier 1 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col">
                 <div className="bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800">Tier 1</h3>
                   <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-white px-2.5 py-1 rounded-full">&gt; 20 Volume</span>
                 </div>
                 <ul className="p-3 text-sm max-h-64 overflow-y-auto custom-scrollbar flex-1 space-y-1">
                    {data.advanced?.tiering?.tier1.map((t:any) => (
                      <li key={t.pjp} className="flex justify-between items-center p-2.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                        <span className="font-medium text-slate-700 truncate pr-2">{t.pjp}</span>
                        <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{t.volume}</span>
                      </li>
                    ))}
                    {data.advanced?.tiering?.tier1.length === 0 && <li className="p-4 text-center text-slate-400 italic text-xs">Belum ada PJP</li>}
                 </ul>
              </div>
              
              {/* Tier 2 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col">
                 <div className="bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800">Tier 2</h3>
                   <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-500 text-white px-2.5 py-1 rounded-full">5 - 20 Volume</span>
                 </div>
                 <ul className="p-3 text-sm max-h-64 overflow-y-auto custom-scrollbar flex-1 space-y-1">
                    {data.advanced?.tiering?.tier2.map((t:any) => (
                      <li key={t.pjp} className="flex justify-between items-center p-2.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                        <span className="font-medium text-slate-700 truncate pr-2">{t.pjp}</span>
                        <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{t.volume}</span>
                      </li>
                    ))}
                    {data.advanced?.tiering?.tier2.length === 0 && <li className="p-4 text-center text-slate-400 italic text-xs">Belum ada PJP</li>}
                 </ul>
              </div>
              
              {/* Tier 3 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col">
                 <div className="bg-white px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800">Tier 3</h3>
                   <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-300 text-slate-700 px-2.5 py-1 rounded-full">&lt; 5 Volume</span>
                 </div>
                 <ul className="p-3 text-sm max-h-64 overflow-y-auto custom-scrollbar flex-1 space-y-1">
                    {data.advanced?.tiering?.tier3.map((t:any) => (
                      <li key={t.pjp} className="flex justify-between items-center p-2.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                        <span className="font-medium text-slate-700 truncate pr-2">{t.pjp}</span>
                        <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{t.volume}</span>
                      </li>
                    ))}
                    {data.advanced?.tiering?.tier3.length === 0 && <li className="p-4 text-center text-slate-400 italic text-xs">Belum ada PJP</li>}
                 </ul>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
