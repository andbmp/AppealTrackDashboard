import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CreditCard, TrendingUp, AlertOctagon } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function Dashboard({ auth }: { auth: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard', {
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
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
    </div>
  );
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">Failed to load data: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Track appeal requests and system performance</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">Export Report</button>
           <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">Refresh Data</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Unique MCC (This Month)</h2>
            <p className="text-3xl font-bold text-gray-900">{data.uniqueMcc || 0}</p>
            <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
              <TrendingUp size={12} /> +12% from last month
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-full group-hover:scale-110 transition-transform">
             <CreditCard className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Volume Forecast (Next Mth)</h2>
            <p className="text-3xl font-bold text-gray-900">{data.advanced?.forecast?.forecastedNextMonthVolume || 0}</p>
            <p className="text-xs text-blue-600 mt-2 font-medium">Estimated projection</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-full group-hover:scale-110 transition-transform">
             <TrendingUp className="text-purple-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">System Status</h2>
            <p className={`text-2xl font-bold ${data.advanced?.anomalies?.anomaliesDetected?.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {data.advanced?.anomalies?.anomaliesDetected?.length > 0 ? 'Anomaly Detected' : 'All Systems Normal'}
            </p>
            <p className="text-xs text-gray-500 mt-2 font-medium">Auto-monitoring active</p>
          </div>
          <div className={`${data.advanced?.anomalies?.anomaliesDetected?.length > 0 ? 'bg-red-50' : 'bg-emerald-50'} p-4 rounded-full group-hover:scale-110 transition-transform`}>
             <AlertOctagon className={data.advanced?.anomalies?.anomaliesDetected?.length > 0 ? 'text-red-600' : 'text-emerald-600'} size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
          <h2 className="font-bold text-gray-800 mb-6">Daily Appeal Volume</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.volumePerDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="tanggal" tickFormatter={(str) => str ? str.substring(8, 10) : ''} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="volume" stroke="#E32636" strokeWidth={3} dot={{r: 4, fill: '#E32636', strokeWidth: 0}} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
          <h2 className="font-bold text-gray-800 mb-6">PJP Distribution ('Done' Status)</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.distributionByPjp} dataKey="count" nameKey="pjp" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}>
                  {data.distributionByPjp?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Tier List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
           <h2 className="font-bold text-gray-800 mb-6">PJP Tier Classification</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border border-red-100 bg-red-50/30 overflow-hidden flex flex-col">
                 <div className="bg-red-100/50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
                   <h3 className="font-bold text-red-700">Tier 1</h3>
                   <span className="text-xs font-semibold bg-white text-red-700 px-2 py-1 rounded-full shadow-sm">&gt; 20 volume</span>
                 </div>
                 <ul className="p-2 text-sm max-h-60 overflow-y-auto custom-scrollbar flex-1">
                    {data.advanced?.tiering?.tier1.map((t:any) => (
                      <li key={t.pjp} className="flex justify-between p-2 hover:bg-white rounded transition-colors">
                        <span className="font-medium text-gray-700">{t.pjp}</span>
                        <span className="text-red-600 font-bold">{t.volume}</span>
                      </li>
                    ))}
                    {data.advanced?.tiering?.tier1.length === 0 && <li className="p-4 text-center text-gray-500 italic">No PJP in Tier 1</li>}
                 </ul>
              </div>
              
              <div className="rounded-lg border border-orange-100 bg-orange-50/30 overflow-hidden flex flex-col">
                 <div className="bg-orange-100/50 px-4 py-3 border-b border-orange-100 flex justify-between items-center">
                   <h3 className="font-bold text-orange-700">Tier 2</h3>
                   <span className="text-xs font-semibold bg-white text-orange-700 px-2 py-1 rounded-full shadow-sm">5-20 volume</span>
                 </div>
                 <ul className="p-2 text-sm max-h-60 overflow-y-auto custom-scrollbar flex-1">
                    {data.advanced?.tiering?.tier2.map((t:any) => (
                      <li key={t.pjp} className="flex justify-between p-2 hover:bg-white rounded transition-colors">
                        <span className="font-medium text-gray-700">{t.pjp}</span>
                        <span className="text-orange-600 font-bold">{t.volume}</span>
                      </li>
                    ))}
                    {data.advanced?.tiering?.tier2.length === 0 && <li className="p-4 text-center text-gray-500 italic">No PJP in Tier 2</li>}
                 </ul>
              </div>
              
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 overflow-hidden flex flex-col">
                 <div className="bg-emerald-100/50 px-4 py-3 border-b border-emerald-100 flex justify-between items-center">
                   <h3 className="font-bold text-emerald-700">Tier 3</h3>
                   <span className="text-xs font-semibold bg-white text-emerald-700 px-2 py-1 rounded-full shadow-sm">&lt; 5 volume</span>
                 </div>
                 <ul className="p-2 text-sm max-h-60 overflow-y-auto custom-scrollbar flex-1">
                    {data.advanced?.tiering?.tier3.map((t:any) => (
                      <li key={t.pjp} className="flex justify-between p-2 hover:bg-white rounded transition-colors">
                        <span className="font-medium text-gray-700">{t.pjp}</span>
                        <span className="text-emerald-600 font-bold">{t.volume}</span>
                      </li>
                    ))}
                    {data.advanced?.tiering?.tier3.length === 0 && <li className="p-4 text-center text-gray-500 italic">No PJP in Tier 3</li>}
                 </ul>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
