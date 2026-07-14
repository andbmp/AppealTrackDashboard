import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, UploadCloud, RefreshCw, CheckCircle, Download, Search, Shield, Home, BarChart2, Layers, Settings, FileText, Activity, X, Menu, ChevronRight, Bell } from 'lucide-react';
import { TierBadge, StatusBadge, Card, CardHead, KPICard, Tip } from '../components/ui';
import { alerts, pjpVolumes, monthlyTrend, actionData, dailyData, errorRows, mccData, heatmapData, pjpList, activityLog } from '../store/data';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function SettingsPage({ role }: any) {
  const [emailList, setEmailList] = useState("ops-team@bank.go.id\nmanager@bank.go.id\nreporting@bank.go.id");
  const [waEnabled, setWaEnabled] = useState(true);
  const [schedule, setSchedule] = useState("harian");

  if (role === "Staff") {
    return (
      <Card className="p-12 text-center max-w-md mx-auto mt-10">
        <Shield size={36} className="mx-auto mb-4 text-muted-foreground" />
        <div className="text-base text-muted-foreground">
          Halaman ini hanya dapat diakses oleh{" "}
          <span className="text-foreground font-semibold">Manajemen</span> atau{" "}
          <span className="text-foreground font-semibold">Administrator</span>.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Sumber Data (FR-01 · FR-03)</h3>
        <div>
          <label className="block text-sm text-muted-foreground mb-2 font-sans uppercase tracking-widest">Path / URL Sumber Data Default</label>
          <input defaultValue="https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkL..."
            className="w-full bg-muted border border-border rounded px-3 py-2 text-base font-sans text-foreground focus:outline-none focus:border-[#00d4aa] transition-colors" />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-3 font-sans uppercase tracking-widest">Format Sumber</label>
          <div className="flex gap-4">
            {["Excel (.xlsx)", "Google Sheets"].map(opt => (
              <label key={opt} className="flex items-center gap-2 text-base cursor-pointer">
                <input type="radio" name="srcfmt" defaultChecked={opt.includes("Google")} className="accent-[#00d4aa]" />
                <span className="text-foreground font-sans">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Notifikasi & Pelaporan (FR-02 · FR-05)</h3>
        <div>
          <label className="block text-sm text-muted-foreground mb-2 font-sans uppercase tracking-widest">Email Penerima Laporan</label>
          <textarea rows={3} value={emailList} onChange={e => setEmailList(e.target.value)}
            className="w-full bg-muted border border-border rounded px-3 py-2 text-base font-sans text-foreground focus:outline-none focus:border-[#00d4aa] resize-none transition-colors" />
          <p className="text-sm text-muted-foreground mt-1 font-sans">Satu email per baris</p>
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-base text-foreground">Notifikasi WhatsApp</div>
            <div className="text-sm text-muted-foreground font-sans mt-0.5">Kirim laporan via WhatsApp Business API</div>
          </div>
          <button onClick={() => setWaEnabled(!waEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${waEnabled ? "bg-[#00d4aa]" : "bg-secondary border border-border"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${waEnabled ? "left-6" : "left-1"}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-2 font-sans uppercase tracking-widest">Jadwal Laporan Otomatis</label>
          <select value={schedule} onChange={e => setSchedule(e.target.value)}
            className="bg-muted border border-border text-base font-sans text-foreground rounded px-3 py-2 focus:outline-none focus:border-[#00d4aa] transition-colors">
            {[["harian","Harian"],["mingguan","Mingguan"],["bulanan","Bulanan"]].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <button className="px-5 py-2 bg-[#00d4aa] text-[#070d1a] text-base font-semibold rounded hover:bg-[#00c49a] transition-colors">
          Simpan Perubahan
        </button>
      </Card>

      {role === "Admin" && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Manajemen Pengguna & RBAC</h3>
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border">
                {["Pengguna", "Peran", "Akses Upload", "Akses Konfigurasi", ""].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-sm text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Siti Rahayu",   role: "Staff",     up: true,  cfg: false },
                { name: "Budi Santoso",  role: "Staff",     up: true,  cfg: false },
                { name: "Rina Dewi",     role: "Admin",     up: true,  cfg: true  },
                { name: "Dewi Kartika",  role: "Staff",     up: true,  cfg: false },
                { name: "Agus Priyanto", role: "Manajemen", up: false, cfg: true  },
              ].map((u, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted transition-colors">
                  <td className="px-3 py-2.5 text-foreground">{u.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-sm ${
                      u.role === "Admin" ? "bg-[#00d4aa]/15 text-[#00d4aa]" :
                      u.role === "Manajemen" ? "bg-blue-500/15 text-blue-400" :
                      "bg-slate-500/15 text-slate-400"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-3 py-2.5"><span className={u.up ? "text-emerald-400" : "text-muted-foreground"}>●</span></td>
                  <td className="px-3 py-2.5"><span className={u.cfg ? "text-emerald-400" : "text-muted-foreground"}>●</span></td>
                  <td className="px-3 py-2.5 text-muted-foreground hover:text-foreground cursor-pointer">Edit</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

