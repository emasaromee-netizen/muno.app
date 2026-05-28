import { useState } from "react";
import { sport_events, sport_activities, type SportStatus } from "@/data/mock";
import { CheckCircle2, X, Clock, Tag, Info } from "lucide-react";
import { formatARS } from "@/lib/format";

const STATUS: Record<SportStatus, { label: string; cls: string }> = {
  available: { label: "Disponible", cls: "bg-muno-teal/15 text-muno-teal" },
  few: { label: "Últimos cupos", cls: "bg-muno-amber/15 text-[hsl(var(--muno-amber))]" },
  full: { label: "Lleno", cls: "bg-muno-red/15 text-muno-red" },
};

const AGES = ["Todos", "Infantil", "Jóvenes", "Adultos"] as const;

export default function Deporte() {
  const [tab, setTab] = useState<"eventos" | "oferta">("eventos");
  const [age, setAge] = useState<(typeof AGES)[number]>("Todos");
  const [enroll, setEnroll] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [hasCert, setHasCert] = useState(false);

  const filtered = age === "Todos" ? sport_activities : sport_activities.filter((a) => a.age_range === age);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[{ k: "eventos", l: "Eventos" }, { k: "oferta", l: "Oferta Municipal" }].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)} className={`px-4 py-2 rounded-[20px] text-sm font-bold ${tab === t.k ? "bg-isa-navy text-isa-white" : "bg-card border"}`}>{t.l}</button>
        ))}
      </div>

      {tab === "eventos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sport_events.map((e) => (
            <article key={e.id} className="isa-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-extrabold text-isa-navy">{e.name}</h3>
                <span className={`isa-chip ${STATUS[e.status].cls}`}>{STATUS[e.status].label}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock strokeWidth={1.5} className="w-3 h-3" />{e.date} · {e.schedule}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Tag strokeWidth={1.5} className="w-3 h-3" />{formatARS(e.price)}</div>
                {e.requirements && <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info strokeWidth={1.5} className="w-3 h-3 mt-0.5" />{e.requirements}</div>}
              </div>
              <button
                disabled={e.status === "full"}
                onClick={() => setEnroll(e)}
                className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm disabled:opacity-40"
              >
                {e.status === "full" ? "Sin cupo" : "Inscribirme"}
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === "oferta" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {AGES.map((a) => (
              <button key={a} onClick={() => setAge(a)} className={`px-4 py-2 rounded-[20px] text-sm font-bold whitespace-nowrap ${age === a ? "bg-muno-teal text-white" : "bg-card border"}`}>{a}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => {
              const pct = Math.round((a.enrolled / a.capacity) * 100);
              return (
                <article key={a.id} className="isa-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-isa-navy">{a.name}</h3>
                    <span className="isa-chip bg-accent text-isa-navy">{a.age_range}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock strokeWidth={1.5} className="w-3 h-3" />{a.discipline} · {a.days} · {a.schedule}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Tag strokeWidth={1.5} className="w-3 h-3" />{formatARS(a.price)} / mes</div>
                    {a.requirements && <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info strokeWidth={1.5} className="w-3 h-3 mt-0.5" />{a.requirements}</div>}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Cupo {a.enrolled}/{a.capacity}</div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-muno-teal" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button onClick={() => setEnroll(a)} className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm">Inscribirme</button>
                </article>
              );
            })}
          </div>
        </>
      )}

      {enroll && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 animate-fade-in">
          <div className="isa-card p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-isa-navy">Inscripción · {enroll.name}</h3>
              <button onClick={() => setEnroll(null)} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Nombre completo" className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy" />
              <input placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy" />
              <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer">
                <span className="text-sm font-semibold text-isa-navy">¿Tenés certificado médico?</span>
                <button type="button" onClick={() => setHasCert(!hasCert)} className={`relative w-12 h-7 rounded-full transition-colors ${hasCert ? "bg-muno-teal" : "bg-muted"}`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${hasCert ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </label>
            </div>
            <button onClick={() => { setEnroll(null); setSuccess(true); }} className="mt-5 w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold">Confirmar</button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 animate-fade-in">
          <div className="isa-card p-8 max-w-sm w-full text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-muno-teal/15 text-muno-teal grid place-items-center mx-auto">
              <CheckCircle2 strokeWidth={1.5} className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-isa-navy mt-4">¡Te inscribiste!</h3>
            <p className="text-sm text-muted-foreground mt-2">Te contactaremos por email.</p>
            <button onClick={() => setSuccess(false)} className="mt-6 w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold">Listo</button>
          </div>
        </div>
      )}
    </div>
  );
}
