import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, UploadCloud, RefreshCw, CheckCircle, Download, Search, Shield, Home, BarChart2, Layers, Settings, FileText, Activity, X, Menu, ChevronRight, Bell } from 'lucide-react';
import { TierBadge, StatusBadge, Card, CardHead, KPICard, Tip } from '../components/ui';
import { alerts, pjpVolumes, monthlyTrend, actionData, dailyData, errorRows, mccData, heatmapData, pjpList, activityLog } from '../store/data';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default 
function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/summary")
      .then(res => res.json())
      .then(res => { if (res.success) setDashboardData(res.data); });
  }, []);

  const [mccWindow, setMccWindow] = useState<"harian" | "mingguan" | "bulanan">("harian");

  const maxHeat = Math.max(...heatmapData.flatMap(d => d.w));
  const heatColor = (v: number) => {
    if (v === 0) return "bg-muted text-muted-foreground/30";
    const pct = v / maxHeat;
    if (pct < 0.25) return "bg-[#00d4aa]/15 text-[#00d4aa]/60";
    if (pct < 0.5)  return "bg-[#00d4aa]/35 text-[#00d4aa]/80";
    if (pct < 0.75) return "bg-[#00d4aa]/60 text-white";
    return "bg-[#00d4aa]/85 text-[#070d1a] font-bold";
  };

  return (
    <div className="space-y-5">
      {/* MCC Chart */}
      <Card>
        <CardHead title="Jumlah MCC Diajukan Appeal (FR-07)"
          extra={
            <div className="flex gap-1 bg-muted p-1 rounded">
              {(["harian", "mingguan", "bulanan"] as const).map(w => (
                <button key={w} onClick={() => setMccWindow(w)}
                  className={`px-3 py-1 text-sm font-sans rounded transition-colors ${
                    mccWindow === w ? "bg-[#00d4aa] text-[#070d1a] font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {w.charAt(0).toUpperCase() + w.slice(1)}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-5">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={dashboardData?.mccData || mccData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="mcc" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="appeals" name="Appeal MCC"      fill="#a855f7" radius={[3, 3, 0, 0]} />
              <Bar dataKey="count"   name="Total Merchant"  fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* MCC Detail Table */}
      <Card>
        <CardHead title="Detail MCC Appeal" />
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {["Kode MCC", "Kategori", "Total Merchant", "Jumlah Appeal", "% Appeal"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dashboardData?.mccData || mccData).map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted transition-colors">
                <td className="px-4 py-3 text-[#00d4aa]">{row.mcc}</td>
                <td className="px-4 py-3 text-foreground">{row.label}</td>
                <td className="px-4 py-3 text-blue-400">{row.count}</td>
                <td className="px-4 py-3 text-amber-400">{row.appeals}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-1">
                      <div className="bg-[#00d4aa] h-1 rounded-full" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="text-muted-foreground">{row.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHead title="Heatmap Distribusi — Hari × Minggu (FR-Adv)" extra={<span className="text-sm font-sans text-muted-foreground">Juli 2026</span>} />
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-sm font-sans min-w-[380px]">
            <thead>
              <tr>
                <th className="text-left pr-4 py-2 text-muted-foreground w-12">Hari</th>
                {["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"].map(w => (
                  <th key={w} className="text-center px-2 py-2 text-sm text-muted-foreground uppercase tracking-wider">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(row => (
                <tr key={row.day}>
                  <td className="pr-4 py-1.5 text-muted-foreground font-semibold">{row.day}</td>
                  {row.w.map((v, wi) => (
                    <td key={wi} className="px-1.5 py-1">
                      <div className={`text-center py-2.5 rounded text-sm transition-colors ${heatColor(v)}`}>
                        {v > 0 ? v : "—"}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-4 text-sm font-sans text-muted-foreground">
            <span>Rendah</span>
            {["bg-[#00d4aa]/15", "bg-[#00d4aa]/35", "bg-[#00d4aa]/60", "bg-[#00d4aa]/85"].map((c, i) => (
              <div key={i} className={`w-8 h-3 rounded ${c}`} />
            ))}
            <span>Tinggi</span>
          </div>
        </div>
      </Card>

      {/* Tiering + Action Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead title="PJP Tiering — Juli 2026 (FR-Adv)" />
          <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
            {(dashboardData?.top5 || pjpList).map((pjp, i) => {
              const vol = pjp.vol;
              return (
                <div key={i} className="flex items-center gap-3 text-sm font-sans">
                  <TierBadge tier={pjp.tier || 1} />
                  <span className="w-28 text-foreground truncate shrink-0">{pjp.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-1">
                    <div className="h-1 rounded-full transition-all"
                      style={{
                        width: `${Math.min((vol / 178) * 100, 100)}%`,
                        background: pjp.tier || 1 === 1 ? "#00d4aa" : pjp.tier || 1 === 2 ? "#3b82f6" : "#64748b",
                      }} />
                  </div>
                  <span className="text-muted-foreground w-8 text-right shrink-0">{vol}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHead title="Rasio Action Per PJP (FR-Adv)" />
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border">
                {["PJP", "Rek.Nama", "Rek.MCC", "Whitelist", "Rejected"].map(h => (
                  <th key={h} className="text-right first:text-left px-3 py-3 text-sm text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dashboardData?.actionPjpData || []).map((row: any, i: number) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted transition-colors">
                  <td className="px-3 py-2.5 text-[#00d4aa] truncate max-w-[100px]">{row.pjp}</td>
                  <td className="px-3 py-2.5 text-right text-foreground">{row.rn}</td>
                  <td className="px-3 py-2.5 text-right text-blue-400">{row.rm}</td>
                  <td className="px-3 py-2.5 text-right text-purple-400">{row.wl}</td>
                  <td className="px-3 py-2.5 text-right text-red-400">{row.rj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Annual trend line chart */}
      <Card>
        <CardHead title="Tren Tahunan — Perbandingan Volume Per Bulan (FR-10)" />
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dashboardData?.monthlyTrend || monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="total"    stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Total" />
              <Line type="monotone" dataKey="done"     stroke="#00d4aa" strokeWidth={2} dot={{ fill: "#00d4aa", r: 3 }} name="Done" />
              <Line type="monotone" dataKey="pending"  stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Pending" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Rejected" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

