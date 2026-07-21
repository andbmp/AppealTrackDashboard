import { useState } from 'react';
import axios from 'axios';

export default function Upload({ auth }: { auth: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (url) formData.append('sheetsUrl', url);

      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      setStatus(res.data);
    } catch (err: any) {
      setStatus({ error: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const downloadErrorLog = () => {
    if (!status?.errors) return;
    const blob = new Blob([JSON.stringify(status.errors, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "error_log.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Data Appeal</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Excel (.xlsx)</label>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded" />
        </div>
        <div className="text-center text-gray-400 font-medium">ATAU</div>
        <div>
          <label className="block text-sm font-medium mb-2">Google Sheets URL</label>
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full border p-2 rounded" />
        </div>
        
        <button onClick={handleUpload} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Memproses...' : 'Proses Data'}
        </button>
      </div>

      {status && (
        <div className={`mt-6 p-4 rounded ${status.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {status.error ? (
            <p className="font-medium">Error: {status.error}</p>
          ) : (
            <div>
              <p className="font-medium">Selesai!</p>
              <p>Total Baris: {status.totalRows}</p>
              <p>Berhasil: {status.successfulRows}</p>
              <p>Gagal: {status.failedRows}</p>
              {status.failedRows > 0 && (
                <button onClick={downloadErrorLog} className="mt-2 bg-red-600 text-white px-4 py-1 rounded text-sm">Download Error Log</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
