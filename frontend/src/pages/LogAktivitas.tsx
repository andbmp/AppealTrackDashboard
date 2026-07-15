import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, UploadCloud, RefreshCw, CheckCircle, Download, Search, Shield, Home, BarChart2, Layers, Settings, FileText, Activity, X, Menu, ChevronRight, Bell } from 'lucide-react';
import { TierBadge, StatusBadge, Card, CardHead, KPICard, Tip } from '../components/ui';
import { alerts, pjpVolumes, monthlyTrend, actionData, dailyData, errorRows, mccData, heatmapData, pjpList, activityLog } from '../store/data';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default 
function LogPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/summary")
      .then(res => res.json())
      .then(res => { if (res.success) setDashboardData(res.data); });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Cari aktivitas, pengguna, atau tindakan..."
            className="w-full bg-muted border border-border rounded pl-9 pr-4 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#00d4aa] transition-colors" />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border rounded text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
          <Download size={13} /> Export CSV
        </button>
      </div>

      <Card>
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {["Waktu", "Pengguna", "Peran", "Aktivitas", "Status", "Records"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dashboardData?.activityLog || activityLog).map(log => (
              <tr key={log.id} className="border-b border-border/50 hover:bg-muted transition-colors">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{log.time}</td>
                <td className="px-4 py-3 text-foreground">{log.user}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-sm ${
                    log.role === "Admin"  ? "bg-[#00d4aa]/15 text-[#00d4aa]" :
                    log.role === "System" ? "bg-purple-500/15 text-purple-400" :
                    "bg-slate-500/15 text-slate-400"
                  }`}>{log.role}</span>
                </td>
                <td className="px-4 py-3 text-foreground max-w-xs truncate">{log.action}</td>
                <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                <td className="px-4 py-3 text-[#00d4aa]">{log.records > 0 ? log.records : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

