import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, UploadCloud, RefreshCw, CheckCircle, Download, Search, Shield, Home, BarChart2, Layers, Settings, FileText, Activity, X, Menu, ChevronRight, Bell } from 'lucide-react';
import { TierBadge, StatusBadge, Card, CardHead, KPICard, Tip } from '../components/ui';
import { alerts, pjpVolumes, monthlyTrend, actionData, dailyData, errorRows, mccData, heatmapData, pjpList, activityLog } from '../store/data';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default 
function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data dari Backend Node.js (PostgreSQL)
    fetch("http://localhost:5000/api/dashboard/summary")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setDashboardData(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal terhubung ke PostgreSQL Backend", err);
        setLoading(false);
      });
  }, []);

  const top5 = Object.entries(pjpVolumes)
    .map(([name, vals]) => ({ name: name.replace("Bank ", ""), vol: vals[6] }))
    .sort((a, b) => b.vol - a.vol).slice(0, 5);

  return (
    <div className="space-y-5">
      {alerts.map(a => (
        <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-sans
          ${a.level === "danger" ? "bg-red-500/8 border-red-500/25 text-red-300" : "bg-amber-500/8 border-amber-500/25 text-amber-300"}`}>
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div className="flex-1 flex items-start gap-2">
            <span className="font-semibold">[{a.pjp}]</span>
            <TierBadge tier={a.tier} />
            <span>{a.msg}</span>
          </div>
          <span className="text-sm text-muted-foreground shrink-0">{a.time}</span>
        </div>
      ))}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Appeal Bulan Ini"  value={dashboardData ? dashboardData.totalAppeals.toString() : "912"}  sub="Juli 2026 (s.d. hari ini)" trend="▲ 8.3% vs Jun" color="teal" />
        <KPICard label="Status Done"       value={dashboardData ? dashboardData.resolved.toString() : "834"}  sub="Tingkat selesai 91.5%"     trend="▲ 2.1%"        color="blue" />
        <KPICard label="Pending Review"    value={dashboardData ? dashboardData.pending.toString() : "78"}   sub="Dalam antrian"                                    color="amber" />
        <KPICard label="Anomali Deteksi"   value={dashboardData ? dashboardData.anomalies.toString() : "12"} sub="T1: 7 · T2: 2 · T3: 3"                           color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHead title="Tren Volume Appeal 2026" extra={<span className="text-sm text-muted-foreground font-sans">Jan — Jul</span>} />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="done"     stroke="#00d4aa" strokeWidth={2} fill="url(#gDone)" name="Done" />
                <Area type="monotone" dataKey="pending"  stroke="#f59e0b" strokeWidth={2} fill="url(#gPend)" name="Pending" />
                <Area type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={1.5} fill="none" name="Rejected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead title="Distribusi Action" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={actionData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  dataKey="value" paddingAngle={2}>
                  {actionData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-3">
              {actionData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-sm font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-foreground">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead title="Top 5 PJP — Juli 2026" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={top5} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="vol" name="Volume" fill="#00d4aa" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead title="Jumlah Proses Per Tanggal" extra={<span className="text-sm text-muted-foreground font-sans">Juli 2026</span>} />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="appeal" name="Appeal" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="done"   name="Done"   fill="#00d4aa" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

