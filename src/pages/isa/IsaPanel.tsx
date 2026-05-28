import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Send, Download } from "lucide-react";
import { buildIsaReportPDF, type IsaKPI } from "@/lib/isaReport";

type Bucket = "searches" | "origins" | "revenue";

const LABELS: Record<Bucket, string> = {
  searches: "Búsquedas",
  origins: "Origen geográfico",
  revenue: "Recaudación",
};

export default function IsaPanel() {
  const { signOut, user } = useAuth();
  const [title, setTitle] = useState("Informe MUNO");
  const [period, setPeriod] = useState(new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" }));
  const [conclusion, setConclusion] = useState("");
  const [data, setData] = useState<Record<Bucket, IsaKPI[]>>({
    searches: [{ label: "", value: "" }],
    origins: [{ label: "", value: "" }],
    revenue: [{ label: "", value: "" }],
  });
  const [busy, setBusy] = useState(false);

  const update = (b: Bucket, i: number, k: "label" | "value", v: string) => {
    setData((d) => ({ ...d, [b]: d[b].map((x, j) => (i === j ? { ...x, [k]: v } : x)) }));
  };
  const add = (b: Bucket) => setData((d) => ({ ...d, [b]: [...d[b], { label: "", value: "" }] }));
  const remove = (b: Bucket, i: number) =>
    setData((d) => ({ ...d, [b]: d[b].filter((_, j) => j !== i) }));

  const buildPayload = () => ({
    title,
    period,
    searches: data.searches.filter((k) => k.label.trim()),
    origins: data.origins.filter((k) => k.label.trim()),
    revenue: data.revenue.filter((k) => k.label.trim()),
    conclusion,
  });

  const previewPdf = () => {
    const blob = buildIsaReportPDF(buildPayload());
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const publish = async () => {
    if (!title.trim() || !conclusion.trim()) {
      toast.error("Completá título y conclusión.");
      return;
    }
    setBusy(true);
    const payload = buildPayload();
    const { error } = await supabase.from("analytics_reports").insert({
      title,
      period,
      body: payload as any,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("No se pudo publicar el informe.");
      return;
    }
    localStorage.setItem("muno.isa.report.unread", "1");
    toast.success("Informe publicado. El Intendente fue notificado.", {
      description: "Badge dorado activado sobre Analítica.",
    });
    setConclusion("");
  };

  return (
    <div className="min-h-screen bg-isa-light p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[22px] font-extrabold text-isa-navy">
              ISA Business Analyst
            </h1>
            <p className="text-xs text-muted-foreground">Carga manual de KPIs y conclusión estratégica.</p>
          </div>
          <button onClick={signOut} className="text-[12px] font-bold text-muno-blue">Cerrar sesión</button>
        </div>

        <div className="bg-card rounded-[20px] p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Título del informe">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </Field>
            <Field label="Período">
              <input value={period} onChange={(e) => setPeriod(e.target.value)} className="input" />
            </Field>
          </div>
        </div>

        {(["searches", "origins", "revenue"] as Bucket[]).map((b) => (
          <div key={b} className="bg-card rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-isa-navy">{LABELS[b]}</h3>
              <button onClick={() => add(b)} className="text-xs font-bold text-muno-blue inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {data[b].map((k, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Concepto"
                    value={k.label}
                    onChange={(e) => update(b, i, "label", e.target.value)}
                    className="input flex-1"
                  />
                  <input
                    placeholder="Valor"
                    value={k.value}
                    onChange={(e) => update(b, i, "value", e.target.value)}
                    className="input w-32"
                  />
                  <button
                    onClick={() => remove(b, i)}
                    className="w-10 grid place-items-center rounded-xl bg-isa-light text-muted-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-card rounded-[20px] p-5 shadow-sm">
          <h3 className="font-extrabold text-isa-navy mb-3">Conclusión estratégica</h3>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={6}
            placeholder="Recomendaciones, oportunidades detectadas, próximos pasos…"
            className="input w-full resize-none"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={previewPdf}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-card border rounded-[20px] py-3 font-bold text-sm text-isa-navy"
          >
            <FileText className="w-4 h-4" /> Vista previa PDF
          </button>
          <button
            onClick={publish}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-isa-navy text-white rounded-[20px] py-3 font-bold text-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {busy ? "Publicando…" : "Publicar informe"}
          </button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground">
          Análisis generado por <strong>ISA Business Analyst</strong> — Propiedad Intelectual de MUNO.
        </p>
      </div>

      <style>{`
        .input { padding: 10px 12px; border-radius: 12px; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); font-size: 13px; outline: none; }
        .input:focus { box-shadow: 0 0 0 2px hsl(var(--isa-navy) / .3); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</span>
      {children}
    </label>
  );
}
