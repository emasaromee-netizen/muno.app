import { useState } from "react";
import { wifi_zones } from "@/data/mock";
import { Wifi } from "lucide-react";

export default function AdminWifi() {
  const [items, setItems] = useState(wifi_zones);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((w) => (
          <div key={w.id} className="isa-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muno-teal/10 text-muno-teal grid place-items-center"><Wifi strokeWidth={1.5} /></div>
              <div className="flex-1">
                <div className="font-extrabold text-isa-navy">{w.name}</div>
                <div className="text-sm text-muted-foreground">{w.address}</div>
              </div>
              <button onClick={() => setItems(items.map((x) => x.id === w.id ? { ...x, active: !x.active } : x))} className={`relative w-12 h-7 rounded-full ${w.active ? "bg-muno-teal" : "bg-muted"}`}>
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${w.active ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="isa-chip bg-accent text-isa-navy">{w.is_free ? "Libre" : "Con clave"}</span>
              <span className="isa-chip bg-muted text-isa-navy">{w.active ? "Activo" : "Inactivo"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
