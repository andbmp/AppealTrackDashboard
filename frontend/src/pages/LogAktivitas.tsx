import React, { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { StatusBadge, Card } from '../components/ui';
import { activityLog } from '../store/data';
import api from '../services/api';

export default 
function LogPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  useEffect(() => {
    api.get("/dashboard")
      .then(res => setDashboardData(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Cari aktivitas, pengguna, atau tindakan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-11 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E32636]/20 focus:border-[#E32636] transition-all" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Waktu", "Pengguna", "Peran", "Aktivitas", "Status", "Records"].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dashboardData?.activityLog || activityLog).map((log: any) => (
              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{log.time}</td>
                <td className="px-6 py-4 text-slate-800 font-bold">{log.user}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    log.role === "Admin"  ? "bg-[#E32636]/10 text-[#E32636] border-[#E32636]/20" :
                    log.role === "System" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                    "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  }`}>{log.role}</span>
                </td>
                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{log.action}</td>
                <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                <td className="px-6 py-4 text-[#E32636] font-bold">{log.records > 0 ? log.records : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

