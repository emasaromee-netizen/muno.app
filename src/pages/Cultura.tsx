import { useState } from "react";
import { workshops, cultural_events } from "@/data/mock";
import { CheckCircle2, X, Calendar, MapPin, Clock, Tag, Info } from "lucide-react";
import { formatARS } from "@/lib/format";

function SuccessModal({ open, onClose, message }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 animate-fade-in p-4">
      <div className="isa-card p-8 max-w-sm w-full text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-muno-teal/15 text-muno-teal grid place-items-center mx-auto">
          <CheckCircle2 strokeWidth={1.5} className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-extrabold text-isa-navy mt-4">¡Te inscribiste!</h3>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        <button onClick={onClose} className="mt-6 w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold">Listo</button>
      </div>
    </div>
  );
}

function EnrollDialog({ workshop, onClose, onSuccess }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const full = workshop.enrolled >= workshop.capacity;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 animate-fade-in p-4">
      <div className="isa-card p-6 max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-isa-navy">{full ? "Lista de espera" : "Inscribirme"}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {full ? "El cupo está completo. Te anotamos en la lista de espera." : `Completá tus datos para "${workshop.name}".`}
        </p>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy" />
        </div>
        <button
          disabled={!name || !email}
          onClick={() => onSuccess(full ? "Te avisamos por email cuando se libere un lugar." : "Te contactaremos por email.")}
          className="mt-5 w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold disabled:opacity-50"
        >
          {full ? "Anotarme en espera" : "Confirmar inscripción"}
        </button>
      </div>
    </div>
  );
}

export default function Cultura() {
  const [tab, setTab] = useState<"talleres" | "eventos">("talleres");
  const [enrollItem, setEnrollItem] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[
          { k: "talleres", label: "Talleres" },
          { k: "eventos", label: "Eventos" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 rounded-[20px] text-sm font-bold ${tab === t.k ? "bg-isa-navy text-isa-white" : "bg-card border"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "talleres" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workshops.map((w) => {
            const pct = Math.round((w.enrolled / w.capacity) * 100);
            const full = w.enrolled >= w.capacity;
            return (
              <article key={w.id} className="isa-card overflow-hidden">
                <img src={w.photo} alt={w.name} className="w-full h-[120px] object-cover" />
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-isa-navy">{w.name}</h3>
                    <p className="text-xs text-muted-foreground">{w.teacher}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Clock strokeWidth={1.5} className="w-3 h-3 mt-0.5" />{w.days} · {w.schedule}</div>
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Tag strokeWidth={1.5} className="w-3 h-3 mt-0.5" />{w.price === 0 ? "Gratuito" : `${formatARS(w.price)} / mes`}</div>
                    {w.requirements && <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Info strokeWidth={1.5} className="w-3 h-3 mt-0.5" />{w.requirements}</div>}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-muted-foreground">Cupo {w.enrolled}/{w.capacity}</span>
                      <span className={full ? "text-muno-red" : "text-isa-navy"}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${full ? "bg-muno-red" : "bg-muno-teal"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => setEnrollItem(w)}
                    className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm"
                  >
                    {full ? "Lista de espera" : "Inscribirme"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "eventos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cultural_events.map((e) => (
            <article key={e.id} className="isa-card overflow-hidden">
              <img src={e.photo} alt={e.title} className="w-full h-56 object-cover" />
              <div className="p-5 space-y-3">
                <h3 className="text-xl font-extrabold text-isa-navy">{e.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar strokeWidth={1.5} className="w-4 h-4" />{e.date} · {e.schedule}</span>
                  <span className="flex items-center gap-1.5"><MapPin strokeWidth={1.5} className="w-4 h-4" />{e.place}</span>
                  <span className="flex items-center gap-1.5"><Tag strokeWidth={1.5} className="w-4 h-4" />{formatARS(e.price)}</span>
                </div>
                {e.requirements && <p className="text-xs text-muted-foreground flex items-start gap-1.5"><Info strokeWidth={1.5} className="w-3.5 h-3.5 mt-0.5" />{e.requirements}</p>}
                <button onClick={() => setEnrollItem({ name: e.title, capacity: e.capacity, enrolled: e.reserved })} className="w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold">
                  Reservar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {enrollItem && (
        <EnrollDialog
          workshop={enrollItem}
          onClose={() => setEnrollItem(null)}
          onSuccess={(msg: string) => { setEnrollItem(null); setSuccess(msg); }}
        />
      )}
      <SuccessModal open={!!success} message={success} onClose={() => setSuccess(null)} />
    </div>
  );
}
