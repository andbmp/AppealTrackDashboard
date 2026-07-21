import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHead, Tip, TierBadge } from '../components/ui';
import { pjpList } from '../store/data';
import api from '../services/api';

export default 
function RankingPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  useEffect(() => {
    api.get("/dashboard")
      .then(res => setDashboardData(res.data))
      .catch(console.error);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(6);
  const MONTH_LABELS = ["Jan 2026","Feb 2026","Mar 2026","Apr 2026","Mei 2026","Jun 2026","Jul 2026"];

  const ranked = (dashboardData?.top5 || pjpList)
    .map((pjp: any) => ({ ...pjp, vol: pjp.vol || 2 }))
    .sort((a: any, b: any) => b.vol - a.vol)
    .slice(0, 10)
    .map((d: any) => ({ ...d, done: d.done ?? Math.floor(d.vol * 0.88), tier: d.tier || 1, type: d.type || 'Bank' }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <p className="text-sm font-bold text-slate-600 tracking-wide">Top 10 PJP berdasarkan volume appeal tertinggi (FR-09)</p>
        <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
          className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#E32636]/20 focus:border-[#E32636] transition-all cursor-pointer">
          {MONTH_LABELS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
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

