import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHead, Tip, TierBadge } from '../components/ui';
import { pjpList } from '../store/data';
import api from '../services/api';

export default 
function RankingPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
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
      
      const res = await api.get(`/dashboard?${params.toString()}`);
      setDashboardData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ranked = (dashboardData?.top5 || pjpList)
    .map((pjp: any) => ({ ...pjp, vol: pjp.vol || 2 }))
    .sort((a: any, b: any) => b.vol - a.vol)
    .slice(0, 10)
    .map((d: any) => ({ ...d, done: d.done ?? Math.floor(d.vol * 0.88), tier: d.tier || 1, type: d.type || 'Bank' }));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#E32636]"></div>
    </div>
  );
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 shadow-sm">Gagal memuat data: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Peringkat PJP</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center">
            Top 10 PJP berdasarkan volume appeal tertinggi
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

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["#", "PJP", "Tier", "Tipe", "Volume", "Done", "Tingkat Selesai"].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((pjp: any, i: number) => (
              <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i === 0 ? "bg-red-50/30" : ""}`}>
                <td className="px-6 py-4">
                  <span className={`font-black text-lg ${i === 0 ? "text-[#E32636]" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-500" : "text-slate-300"}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-800 font-bold">{pjp.name}</td>
                <td className="px-6 py-4"><TierBadge tier={pjp.tier} /></td>
                <td className="px-6 py-4 text-slate-500 font-medium">{pjp.type}</td>
                <td className="px-6 py-4 text-slate-800 font-black">{pjp.vol}</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">{pjp.done}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-[#E32636] h-1.5 rounded-full" style={{ width: `${Math.round((pjp.done / pjp.vol) * 100)}%` }} />
                    </div>
                    <span className="text-slate-600 font-medium text-xs">{Math.round((pjp.done / pjp.vol) * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHead title="Visualisasi Top 10 PJP" />
        <div className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ranked.map((d: any) => ({ name: d.name.replace("Bank ", ""), volume: d.vol, done: d.done }))} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#475569", fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="volume" name="Volume" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={20} />
              <Bar dataKey="done"   name="Done"   fill="#E32636" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

