import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function TierBadge({ tier }: { tier: number }) {
  const cfg = {
    1: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    2: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    3: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  }[tier]!;
  return (
    <span className={`px-2 py-0.5 text-sm font-sans rounded ${cfg}`}>
      Tier {tier}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    success: ["bg-emerald-500/15 text-emerald-400", "Berhasil"],
    partial: ["bg-amber-500/15 text-amber-400",   "Parsial"],
    warning: ["bg-amber-500/15 text-amber-400",   "Peringatan"],
    error:   ["bg-red-500/15 text-red-400",        "Error"],
  };
  const [cls, label] = map[status] ?? ["bg-slate-500/15 text-slate-400", status];
  return <span className={`px-2 py-0.5 text-sm font-sans rounded ${cls}`}>{label}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-lg ${className}`}>{children}</div>;
}

export function CardHead({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
      <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
      {extra}
    </div>
  );
}

export function KPICard({ label, value, sub, trend, color = "teal" }: {
  label: string; value: string; sub: string; trend?: string; color?: string;
}) {
  const c: Record<string, string> = {
    teal: "text-[#00d4aa]", blue: "text-blue-400",
    amber: "text-amber-400", slate: "text-slate-400",
  };
  return (
    <Card className="p-5">
      <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2 font-sans">{label}</div>
      <div className={`text-3xl font-bold font-sans ${c[color]}`}>{value}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-sans">{sub}</span>
        {trend && <span className="text-sm font-sans text-emerald-400">{trend}</span>}
      </div>
    </Card>
  );
}

export const Tip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1929] border border-[rgba(255,255,255,0.12)] rounded px-3 py-2 text-sm font-sans shadow-xl z-50 relative">
      <div className="text-slate-400 mb-1.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-semibold">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

