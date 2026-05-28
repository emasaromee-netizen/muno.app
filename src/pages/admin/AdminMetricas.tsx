import { useEffect, useState } from "react";
import { Lock, Download, ShieldCheck, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildIsaReportPDF, type IsaReportData } from "@/lib/isaReport";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#242E44", "#1A56F0", "#00B89C", "#F5C84B", "#EF4444", "#10B981"];

export default function AdminMetricas() {
  const [reports, setReports] = useState<any[]>([]);
  const [latest, setLatest] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("analytics_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = data || [];
        setReports(list);
        setLatest(list[0] || null);
      });
    localStorage.setItem("muno.isa.report.unread", "0");
  }, []);

  const download = (r: any) => {
    const body = (r.body || {}) as IsaReportData;
    const blob = buildIsaReportPDF({
      title: r.title,
      period: r.period || "",
      searches: body.searches || [],
      origins: body.origins || [],
      revenue: body.revenue || [],
      conclusion: body.conclusion || "",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ISA_${(r.period || "informe").replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const body = (latest?.body || {}) as IsaReportData;
  const hasKPIs = !!latest && (body.searches?.length || body.origins?.length || body.revenue?.length);

  return (
    <div className="space-y-6">
      {!latest && <Locked />}

      {latest && (
        <>
          <div className="bg-white rounded-[16px] p-6 border flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-isa-light text-isa-navy grid place-items-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-isa-navy bg-isa-light px-2 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Auditoría ISA
              </div>
              <h2 className="font-display font-extrabold text-isa-navy text-[20px] mt-2">{latest.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Período {latest.period} · publicado {new Date(latest.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => download(latest)}
              className="inline-flex items-center gap-2 bg-isa-navy text-white rounded-[12px] px-4 py-2.5 text-[13px] font-bold hover:opacity-90 min-h-[44px]"
            >
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
          </div>

          {hasKPIs && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {body.origins?.length > 0 && (
                <ChartCard title="Origen de visitantes">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={body.origins} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                        {body.origins.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {body.searches?.length > 0 && (
                <ChartCard title="Búsquedas por categoría">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={body.searches}>
                      <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#242E44" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              {body.revenue?.length > 0 && (
                <ChartCard title="Recaudación" className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={body.revenue}>
                      <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00B89C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}

          {body.conclusion && (
            <div className="bg-white rounded-[16px] p-6 border">
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
                Conclusión estratégica
              </div>
              <p className="text-sm text-isa-navy mt-2 leading-relaxed whitespace-pre-line">{body.conclusion}</p>
            </div>
          )}

          <div className="bg-white rounded-[16px] p-6 border">
            <div className="font-extrabold text-isa-navy mb-3">Centro de informes</div>
            <div className="divide-y">
              {reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-isa-navy text-sm truncate">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.period} · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => download(r)}
                    className="text-[12px] font-bold text-muno-blue inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg hover:bg-isa-light"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-[10px] text-center text-muted-foreground">
        Análisis generado por <strong>ISA Business Analyst</strong> — Propiedad Intelectual de MUNO.
      </p>
    </div>
  );
}

function Locked() {
  return (
    <div className="relative overflow-hidden bg-white rounded-[16px] p-10 text-center border">
      <div className="absolute inset-0 -z-0 bg-gradient-to-br from-isa-navy/10 via-muno-blue/10 to-muno-emerald/10 blur-2xl" />
      <div className="relative z-10 max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-isa-navy text-white grid place-items-center">
          <Lock strokeWidth={1.5} className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-isa-navy bg-isa-light px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" /> Auditoría ISA
        </div>
        <h2 className="font-display font-extrabold text-isa-navy text-[20px]">
          Módulo gestionado por ISA
        </h2>
        <p className="text-sm text-muted-foreground">
          Informe en proceso de auditoría. La analítica del municipio es elaborada y validada
          manualmente por un Business Analyst de ISA.
        </p>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: any) {
  return (
    <div className={`bg-white rounded-[16px] p-5 border ${className}`}>
      <div className="font-extrabold text-isa-navy text-sm mb-3">{title}</div>
      {children}
    </div>
  );
}
