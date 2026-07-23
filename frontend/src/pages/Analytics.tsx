import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHead, Tip } from '../components/ui';
import { monthlyTrend, mccData, heatmapData } from '../store/data';
import api from '../services/api';

export default 
function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  useEffect(() => {
    api.get("/dashboard")
      .then(res => setDashboardData(res.data))
      .catch(console.error);
  }, []);

  const [mccWindow, setMccWindow] = useState<"harian" | "mingguan" | "bulanan">("harian");

  const maxHeat = Math.max(...(dashboardData?.heatmapData || heatmapData).flatMap((d: any) => d.w));
  const heatColor = (v: number) => {
    if (v === 0) return "bg-slate-50 text-slate-300";
    const pct = v / maxHeat;
    if (pct < 0.25) return "bg-red-50 text-red-400";
    if (pct < 0.5)  return "bg-red-200 text-red-600";
    if (pct < 0.75) return "bg-red-400 text-white";
    return "bg-[#E32636] text-white font-bold";
  };

  return (
    <div className="space-y-6">
      {/* MCC Chart */}
      <Card>
        <CardHead title="Jumlah MCC Diajukan Appeal"
          extra={
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(["harian", "mingguan", "bulanan"] as const).map(w => (
                <button key={w} onClick={() => setMccWindow(w)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    mccWindow === w ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}>
                  {w.charAt(0).toUpperCase() + w.slice(1)}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData?.mccData?.[mccWindow] || dashboardData?.mccData?.harian || mccData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mcc" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} content={<Tip />} />
              <Bar dataKey="appeals" name="Appeal MCC"      fill="#E32636" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="count"   name="Total Merchant"  fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* MCC Detail Table */}
      <Card>
        <CardHead title="Detail MCC Appeal" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Kode MCC", "Kategori", "Total Merchant", "Jumlah Appeal", "% Appeal"].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dashboardData?.mccData?.[mccWindow] || dashboardData?.mccData?.harian || mccData).map((row: any, i: number) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-800 font-bold">{row.mcc}</td>
                <td className="px-6 py-4 text-slate-600">{row.label}</td>
                <td className="px-6 py-4 text-slate-500">{row.count}</td>
                <td className="px-6 py-4 text-[#E32636] font-bold">{row.appeals}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-[#E32636] h-1.5 rounded-full" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="text-slate-600 font-medium text-xs">{row.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHead title="Heatmap Distribusi — Hari × Minggu" extra={<span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">Juli 2026</span>} />
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[380px]">
            <thead>
              <tr>
                <th className="text-left pr-4 py-2 text-slate-400 w-16 text-xs uppercase tracking-wider">Hari</th>
                {["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"].map(w => (
                  <th key={w} className="text-center px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dashboardData?.heatmapData || heatmapData).map((row: any) => (
                <tr key={row.day}>
                  <td className="pr-4 py-2 text-slate-700 font-bold text-xs uppercase">{row.day}</td>
                  {row.w.map((v: number, wi: number) => (
                    <td key={wi} className="px-1.5 py-1.5">
                      <div className={`text-center py-3 rounded-md text-xs transition-colors border border-transparent ${heatColor(v)} ${v > 0 ? 'shadow-sm' : ''}`}>
                        {v > 0 ? v : "—"}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-6 text-xs font-medium text-slate-500 justify-end">
            <span>Rendah</span>
            {["bg-red-50", "bg-red-200", "bg-red-400", "bg-[#E32636]"].map((c, i) => (
              <div key={i} className={`w-10 h-3 rounded-sm ${c}`} />
            ))}
            <span>Tinggi</span>
          </div>
        </div>
      </Card>

      {/* Action Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHead title="Rasio Action Per PJP" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["PJP", "Rek.Nama", "Rek.MCC", "Whitelist", "Rejected"].map(h => (
                  <th key={h} className="text-right first:text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dashboardData?.actionPjpData || []).map((row: any, i: number) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-800 font-bold truncate max-w-[100px]">{row.pjp}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.rn}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.rm}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{row.wl}</td>
                  <td className="px-4 py-3 text-right text-[#E32636] font-medium">{row.rj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        
        <Card>
          <CardHead title="Tren Tahunan — Perbandingan Volume Per Bulan" />
          <div className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dashboardData?.monthlyTrend || monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="total"    stroke="#94a3b8" strokeWidth={2} dot={{ fill: "#94a3b8", r: 4, strokeWidth: 0 }} name="Total" />
                <Line type="monotone" dataKey="done"     stroke="#E32636" strokeWidth={3} dot={{ fill: "#E32636", r: 4, strokeWidth: 0 }} name="Done" />
                <Line type="monotone" dataKey="pending"  stroke="#f59e0b" strokeWidth={2} dot={false} name="Pending" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={false} name="Rejected" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

