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

  const doUpload = async (file: File) => {
    if (!file) return;
    setUploadState("processing");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/upload/excel", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      setUploadResult(result);
      setUploadState("done");
    } catch (err) {
      console.error("Upload error", err);
      setUploadResult({ success: false, message: "Gagal terhubung ke backend." });
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
        <div className="flex border-b border-border">
          {(["file", "sheets"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                tab === t ? "text-[#00d4aa] border-b-2 border-[#00d4aa] -mb-px" : "text-muted-foreground hover:text-foreground"
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
                ${dragOver ? "border-[#00d4aa] bg-[#00d4aa]/8" : "border-border hover:border-[#00d4aa]/50 hover:bg-[#00d4aa]/4"}`}>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileSelect} />
              <UploadCloud size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-base font-medium text-foreground">Seret & lepas file .xlsx di sini</p>
              <p className="text-sm text-muted-foreground mt-1">atau klik untuk memilih file</p>
              <p className="text-sm text-muted-foreground mt-3 font-sans bg-muted inline-block px-3 py-1 rounded">
                Maks. 50 MB · Hingga 10.000 baris · &lt; 5 detik
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-sans uppercase tracking-widest">URL Google Sheets</label>
                <div className="flex gap-3">
                  <input value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 bg-muted border border-border rounded px-3 py-2 text-base font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#00d4aa] transition-colors" />
                  <button onClick={() => alert("Simulasi integrasi Google Sheets. Gunakan Excel untuk tes DB nyata.")}
                    className="px-4 py-2 bg-[#00d4aa] text-[#070d1a] text-base font-semibold rounded hover:bg-[#00c49a] transition-colors">
                    Tarik Data
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-sans">Pastikan lembar kerja dapat diakses publik atau service account sudah dikonfigurasi.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {uploadState === "processing" && (
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <RefreshCw size={18} className="text-[#00d4aa] animate-spin shrink-0" />
            <div className="flex-1">
              <div className="text-base font-medium text-foreground">Memproses file...</div>
              <div className="text-sm text-muted-foreground mt-0.5 font-sans">Validasi kolom · Parsing baris · Menyimpan ke PostgreSQL</div>
              <div className="mt-3 bg-muted rounded-full h-1">
                <div className="bg-[#00d4aa] h-1 rounded-full" style={{ width: "65%", transition: "width 2s ease-out" }} />
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
                <div className="text-base font-semibold text-foreground">
                  {uploadResult?.success ? "Upload Selesai" : "Upload Gagal"}
                </div>
                <div className="text-sm text-muted-foreground font-sans mt-0.5">
                  {uploadResult?.success 
                    ? `${uploadResult.inserted} baris berhasil disimpan · ${uploadResult.errors?.length || 0} baris ditolak · ${uploadResult.fileName}`
                    : uploadResult?.message || "Terjadi kesalahan saat upload."}
                </div>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-[#00d4aa] hover:underline font-sans shrink-0">
                <Download size={12} /> Error Log
              </button>
            </div>
          </Card>
          <Card>
            <CardHead title="Error Log" extra={<span className="text-sm font-sans text-red-400">3 baris ditolak</span>} />
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border">
                  {["Baris", "Kolom", "Alasan Gagal"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(uploadResult?.errors || errorRows).map((r: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted transition-colors">
                    <td className="px-4 py-3 text-amber-400">{r.row}</td>
                    <td className="px-4 py-3 text-blue-400">{r.col || "Data"}</td>
                    <td className="px-4 py-3 text-foreground">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <Card>
        <CardHead title="Spesifikasi Kolom Wajib (FR-04) - Eskalasi Data Merchant" />
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {["Kolom Database", "Tipe Data", "Wajib", "Contoh Nilai"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground uppercase tracking-wider">{h}</th>
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
              <tr key={col} className="border-b border-border/50 hover:bg-muted transition-colors">
                <td className="px-4 py-3 text-[#00d4aa]">{col}</td>
                <td className="px-4 py-3 text-blue-400">{type}</td>
                <td className="px-4 py-3"><span className={req === "Ya" ? "text-emerald-400" : "text-muted-foreground"}>{req}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      
      <Card className="mt-4">
        <CardHead title="Spesifikasi Kolom Wajib - Merchant Blacklist" />
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {["Kolom Database", "Tipe Data", "Wajib", "Contoh Nilai"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm text-muted-foreground uppercase tracking-wider">{h}</th>
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
              <tr key={col} className="border-b border-border/50 hover:bg-muted transition-colors">
                <td className="px-4 py-3 text-[#00d4aa]">{col}</td>
                <td className="px-4 py-3 text-blue-400">{type}</td>
                <td className="px-4 py-3"><span className={req === "Ya" ? "text-emerald-400" : "text-muted-foreground"}>{req}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

