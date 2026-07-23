import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, UploadCloud, RefreshCw, CheckCircle, Download, Search, Shield, Home, BarChart2, Layers, Settings, FileText, Activity, X, Menu, ChevronRight, Bell } from 'lucide-react';
import { TierBadge, StatusBadge, Card, CardHead, KPICard, Tip } from '../components/ui';
import { alerts, pjpVolumes, monthlyTrend, actionData, dailyData, errorRows, mccData, heatmapData, pjpList, activityLog } from '../store/data';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default 
function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "processing" | "done">("idle");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [tab, setTab] = useState<"file" | "sheets">("file");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  
  // Ambil data auth dari store
  const { role } = useAuthStore();
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');

  useEffect(() => {
    // Ambil default URL dari settings saat komponen dimuat
    const fetchDefaultConfig = async () => {
      try {
        const res = await api.get('/admin/config', {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        if (res.data?.sheetUrl) {
          setSheetsUrl(res.data.sheetUrl);
        }
      } catch (err) {
        console.error("Gagal memuat konfigurasi default", err);
      }
    };
    fetchDefaultConfig();
  }, []);

  const doUpload = async (file: File) => {
    if (!file) return;
    setUploadState("processing");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/upload", formData);
      setUploadResult({ success: true, ...response.data });
      setUploadState("done");
    } catch (err: any) {
      console.error("Upload error", err);
      setUploadResult({ success: false, message: err.response?.data?.error || "Gagal memproses file." });
      setUploadState("done");
    }
  };

  const doUploadSheets = async () => {
    if (!sheetsUrl) return;
    setUploadState("processing");
    
    try {
      const response = await api.post("/upload", { sheetsUrl });
      setUploadResult({ success: true, ...response.data });
      setUploadState("done");
    } catch (err: any) {
      console.error("Upload error", err);
      setUploadResult({ success: false, message: err.response?.data?.error || "Gagal menarik data dari Google Sheets." });
      setUploadState("done");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      doUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      doUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <Card>
        <div className="flex border-b border-gray-200">
          {(["file", "sheets"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                tab === t ? "text-[#E32636] border-b-2 border-[#E32636] -mb-px" : "text-gray-500 hover:text-gray-900"
              }`}>
              {t === "file" ? "📄  Unggah File Excel (.xlsx)" : "🔗  Google Sheets"}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === "file" ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all select-none
                ${dragOver ? "border-[#E32636] bg-[#E32636]/8" : "border-gray-200 hover:border-[#E32636]/50 hover:bg-[#E32636]/4"}`}>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileSelect} />
              <UploadCloud size={40} className="mx-auto mb-3 text-gray-500" />
              <p className="text-base font-medium text-gray-900">Seret & lepas file .xlsx di sini</p>
              <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file</p>
              <p className="text-sm text-gray-500 mt-3 font-sans bg-gray-50 inline-block px-3 py-1 rounded">
                Maks. 50 MB · Hingga 10.000 baris · &lt; 5 detik
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-2 font-sans uppercase tracking-widest">URL Google Sheets</label>
                <div className="flex gap-3">
                  <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-base font-sans text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#E32636] transition-colors" />
                  <button onClick={doUploadSheets}
                    disabled={!sheetsUrl || uploadState === "processing"}
                    className="px-4 py-2 bg-[#E32636] text-white text-base font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Tarik Data
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2 font-sans">Pastikan lembar kerja dapat diakses publik atau service account sudah dikonfigurasi.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {uploadState === "processing" && (
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <RefreshCw size={18} className="text-[#E32636] animate-spin shrink-0" />
            <div className="flex-1">
              <div className="text-base font-medium text-gray-900">Memproses file...</div>
              <div className="text-sm text-gray-500 mt-0.5 font-sans">Validasi kolom · Parsing baris · Menyimpan ke PostgreSQL</div>
              <div className="mt-3 bg-gray-50 rounded-full h-1">
                <div className="bg-[#E32636] h-1 rounded-full" style={{ width: "65%", transition: "width 2s ease-out" }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {uploadState === "done" && (
        <div className="space-y-4">
          <Card className="p-4 border-emerald-500/25 bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900">
                  {uploadResult?.success ? "Upload Selesai" : "Upload Gagal"}
                </div>
                <div className="text-sm text-gray-500 font-sans mt-0.5">
                  {uploadResult?.success 
                    ? `${uploadResult.inserted} baris berhasil disimpan · ${uploadResult.errors?.length || 0} baris ditolak · ${uploadResult.fileName}`
                    : uploadResult?.message || "Terjadi kesalahan saat upload."}
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-[#E32636] hover:underline font-sans shrink-0">
                <Download size={12} /> Error Log
              </button>
            </div>
          </Card>
          <Card>
            <CardHead title="Error Log" extra={<span className="text-sm font-sans text-red-400">{(uploadResult?.errors?.length || 0)} baris ditolak</span>} />
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Baris", "Kolom", "Alasan Gagal"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-sm text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(uploadResult?.errors || errorRows).map((r: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200/50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-amber-400">{r.row}</td>
                    <td className="px-4 py-3 text-blue-400">{r.col || "Data"}</td>
                    <td className="px-4 py-3 text-gray-900">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <Card>
        <CardHead title="Spesifikasi Kolom Wajib - Eskalasi Data Merchant" />
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-gray-200">
              {["Kolom Database", "Tipe Data", "Wajib", "Contoh Nilai"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["no_referensi",               "String",           "Ya",   "1, 2, 3"],
              ["tanggal",                    "Date (YYYY-MM-DD)","Ya",   "2026-07-13"],
              ["appeal_worker",              "String",           "Tidak","Siti Rahayu"],
              ["pjp",                        "String",           "Ya",   "Bank BCA"],
              ["nama_merchant",              "String",           "Ya",   "Toko Maju Jaya"],
              ["mcc",                        "String",           "Tidak","5411"],
              ["rekomendasi_nama_merchant",  "String",           "Tidak","Toko Maju Jaya Baru"],
              ["rekomendasi_mcc",            "String",           "Tidak","5412"],
              ["action",                     "String",           "Tidak","Insert Whitelist"],
              ["insert_whitelist",           "Boolean",          "Tidak","TRUE / FALSE"],
            ].map(([col, type, req, ex]) => (
              <tr key={col} className="border-b border-gray-200/50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-[#E32636]">{col}</td>
                <td className="px-4 py-3 text-blue-400">{type}</td>
                <td className="px-4 py-3"><span className={req === "Ya" ? "text-emerald-400" : "text-gray-500"}>{req}</span></td>
                <td className="px-4 py-3 text-gray-500">{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      
      <Card className="mt-4">
        <CardHead title="Spesifikasi Kolom Wajib - Merchant Blacklist" />
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-gray-200">
              {["Kolom Database", "Tipe Data", "Wajib", "Contoh Nilai"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["tanggal",                    "Date (YYYY-MM-DD)","Ya",   "2026-07-13"],
              ["pjp",                        "String",           "Ya",   "Bank BCA"],
              ["nama_merchant",              "String",           "Ya",   "Toko Penipu"],
              ["ktp",                        "String",           "Tidak","327123..."],
              ["npwp",                       "String",           "Tidak","01.234..."],
              ["terindikasi_nama_merchant",  "String",           "Tidak","Toko Penipu A"],
              ["keterangan_delete",          "String",           "Tidak","Fraud Indication"],
            ].map(([col, type, req, ex]) => (
              <tr key={col} className="border-b border-gray-200/50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-[#E32636]">{col}</td>
                <td className="px-4 py-3 text-blue-400">{type}</td>
                <td className="px-4 py-3"><span className={req === "Ya" ? "text-emerald-400" : "text-gray-500"}>{req}</span></td>
                <td className="px-4 py-3 text-gray-500">{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

