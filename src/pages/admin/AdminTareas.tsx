import { useState } from "react";
import { area_tasks, AREAS, type Area, type AreaTask, collaborators } from "@/data/mock";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useRole } from "@/context/RoleContext";

export default function AdminTareas() {
  const { adminArea } = useRole();
  const scopedArea = (AREAS as readonly string[]).includes(adminArea) ? (adminArea as Area) : "Cultura";
  const [tasks, setTasks] = useState<AreaTask[]>(area_tasks);
  const [form, setForm] = useState({ title: "", assignee: collaborators[0]?.email || "", due: "" });

  const filtered = tasks.filter((t) => t.area === scopedArea);

  const add = () => {
    if (!form.title || !form.due) return;
    setTasks([{ id: String(Date.now()), area: scopedArea, status: "Pendiente", ...form }, ...tasks]);
    setForm({ title: "", assignee: collaborators[0]?.email || "", due: "" });
  };

  const toggle = (id: string) => setTasks((p) => p.map((t) => t.id === id ? { ...t, status: t.status === "Hecho" ? "Pendiente" : "Hecho" } : t));
  const remove = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));

  return (
    <div className="space-y-4">
      <div className="isa-card p-4">
        <h3 className="mb-2">Asignar tarea · {scopedArea}</h3>
        <div className="space-y-2">
          <input placeholder="Título de la tarea" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="px-3 py-2.5 rounded-xl border bg-background text-sm">
              {collaborators.filter((c) => c.area === scopedArea || true).map((c) => <option key={c.id} value={c.email}>{c.email}</option>)}
            </select>
            <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className="px-3 py-2.5 rounded-xl border bg-background text-sm" />
          </div>
          <button onClick={add} className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> Asignar</button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin tareas activas.</p>}
        {filtered.map((t) => (
          <div key={t.id} className="isa-card p-3 flex items-center gap-3">
            <button onClick={() => toggle(t.id)} className="text-isa-navy">
              {t.status === "Hecho" ? <CheckCircle2 className="w-5 h-5 text-muno-teal" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-bold text-isa-navy ${t.status === "Hecho" ? "line-through opacity-60" : ""}`}>{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.assignee} · vence {t.due}</div>
            </div>
            <button onClick={() => remove(t.id)} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muno-red/10 text-muno-red"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
