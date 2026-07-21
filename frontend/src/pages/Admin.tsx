import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Admin({ auth }: { auth: any }) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [emails, setEmails] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/config', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      setSheetUrl(res.data.sheetUrl || '');
      setEmails(res.data.emails?.join(', ') || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setStatus('Menyimpan...');
    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
      await axios.post('http://localhost:5000/api/admin/config', {
        sheetUrl,
        emails: emailList
      }, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      setStatus('Berhasil disimpan!');
      setTimeout(() => setStatus(''), 3000);
    } catch (err: any) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
             <Settings className="text-red-600" /> System Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage global application settings and integrations</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Default Google Sheets URL</label>
            <p className="text-xs text-gray-500 mb-2">The default sheet to pull data from when using auto-ingest.</p>
            <input 
              type="text" 
              value={sheetUrl} 
              onChange={e => setSheetUrl(e.target.value)} 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow" 
            />
          </div>
          
          <hr className="border-gray-100" />
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Anomaly Alert Recipients</label>
            <p className="text-xs text-gray-500 mb-2">Comma separated list of emails that will receive automated anomaly alerts.</p>
            <textarea 
              value={emails} 
              onChange={e => setEmails(e.target.value)} 
              placeholder="admin@example.com, manager@example.com" 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow h-24" 
            />
          </div>
          
          <button 
            onClick={handleSave} 
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#E32636] text-white px-6 py-3 rounded-md font-bold hover:bg-red-700 transition-colors shadow-md mt-4"
          >
            <Save size={18} /> Save Configuration
          </button>

          {status && (
            <div className={`p-4 rounded-md mt-4 flex items-center gap-3 ${status.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {status.includes('Error') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-medium">{status}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
