import React from 'react';

export function TierBadge({ tier }: { tier: number }) {
  const cfg = {
    1: "bg-[#E32636]/10 text-[#E32636] border border-[#E32636]/20",
    2: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
    3: "bg-slate-500/10 text-slate-600 border border-slate-500/20",
  }[tier]!;
  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${cfg}`}>
      Tier {tier}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    success: ["bg-emerald-500/10 text-emerald-600 border border-emerald-500/20", "Berhasil"],
    partial: ["bg-amber-500/10 text-amber-600 border border-amber-500/20",   "Parsial"],
    warning: ["bg-amber-500/10 text-amber-600 border border-amber-500/20",   "Peringatan"],
    error:   ["bg-[#E32636]/10 text-[#E32636] border border-[#E32636]/20",   "Error"],
  };
  const [cls, label] = map[status.toLowerCase()] ?? ["bg-slate-500/10 text-slate-600 border border-slate-500/20", status];
  return <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${cls}`}>{label}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden ${className}`}>{children}</div>;
}

export function CardHead({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
      <h2 className="text-sm font-bold text-slate-800 tracking-wide">{title}</h2>
      {extra}
    </div>
  );
}

export function KPICard({ label, value, sub, trend, color = "red" }: {
  label: string; value: string; sub: string; trend?: string; color?: string;
}) {
  const c: Record<string, string> = {
    red: "text-[#E32636]", blue: "text-blue-600",
    amber: "text-amber-500", slate: "text-slate-700", emerald: "text-emerald-600"
  };
  return (
    <Card className="p-6 hover:shadow-md hover:border-slate-200 transition-all">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold ${c[color]}`}>{value}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{sub}</span>
        {trend && <span className="text-xs font-bold text-emerald-600">{trend}</span>}
      </div>
    </Card>
  );
}

export const Tip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm shadow-lg z-50 relative">
      <div className="text-slate-500 font-semibold mb-2 border-b border-slate-100 pb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-6" style={{ color: p.color === '#00d4aa' ? '#E32636' : p.color }}>
          <span className="font-medium">{p.name}</span>
          <span className="font-bold">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

