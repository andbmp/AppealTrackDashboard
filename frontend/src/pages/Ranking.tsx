import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, UploadCloud, RefreshCw, CheckCircle, Download, Search, Shield, Home, BarChart2, Layers, Settings, FileText, Activity, X, Menu, ChevronRight, Bell } from 'lucide-react';
import { TierBadge, StatusBadge, Card, CardHead, KPICard, Tip } from '../components/ui';
import { alerts, pjpVolumes, monthlyTrend, actionData, dailyData, errorRows, mccData, heatmapData, pjpList, activityLog } from '../store/data';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default 
function RankingPage() {
  const [selectedMonth, setSelectedMonth] = useState(6);
  const MONTH_LABELS = ["Jan 2026","Feb 2026","Mar 2026","Apr 2026","Mei 2026","Jun 2026","Jul 2026"];

  const ranked = pjpList
    .map(pjp => ({ ...pjp, vol: pjpVolumes[pjp.name]?.[selectedMonth] ?? 2 }))
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 10)
    .map(d => ({ ...d, done: Math.floor(d.vol * 0.88) }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-sans">Top 10 PJP berdasarkan volume appeal tertinggi (FR-09)</p>
        <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
          className="bg-muted border border-border text-sm font-sans text-foreground rounded px-3 py-1.5 focus:outline-none focus:border-[#00d4aa] transition-colors">
          {MONTH_LABELS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      <Card>
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {["#", "PJP", "Tier", "Tipe", "Volume", "Done", "Tingkat Selesai"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((pjp, i) => (
              <tr key={i} className={`border-b border-border/50 hover:bg-muted transition-colors ${i === 0 ? "bg-[#00d4aa]/5" : ""}`}>
                <td className="px-4 py-3">
                  <span className={`font-bold text-lg ${i === 0 ? "text-[#00d4aa]" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground font-medium">{pjp.name}</td>
                <td className="px-4 py-3"><TierBadge tier={pjp.tier} /></td>
                <td className="px-4 py-3 text-muted-foreground">{pjp.type}</td>
                <td className="px-4 py-3 text-[#00d4aa] font-bold">{pjp.vol}</td>
                <td className="px-4 py-3 text-blue-400">{pjp.done}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-1">
                      <div className="bg-[#00d4aa] h-1 rounded-full" style={{ width: "88%" }} />
                    </div>
                    <span className="text-muted-foreground">88%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHead title="Visualisasi Top 10 PJP" />
        <div className="p-5">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ranked.map(d => ({ name: d.name.replace("Bank ", ""), volume: d.vol, done: d.done }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} width={75} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="volume" name="Volume" fill="#3b82f6" radius={[0, 2, 2, 0]} />
              <Bar dataKey="done"   name="Done"   fill="#00d4aa" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

