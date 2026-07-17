import { useState } from "react";
import { area_tasks, AREAS, type Area, type AreaTask, collaborators } from "@/data/mock";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/security/can";
import { PERMISSIONS } from "@/security/permissions";
import { toast } from "sonner";

export default function AdminTareas() {
  const { user, roles, area: adminArea } = useAuth();

  const canManageTasks = can(roles, adminArea, PERMISSIONS.TASKS_MANAGE);
  const canDeleteTasks = can(roles, adminArea, PERMISSIONS.TASKS_DELETE);
  const canViewAllTaskAreas = can(roles, adminArea, PERMISSIONS.TASKS_ALL_AREAS);

  const scopedArea =
    adminArea && AREAS.includes(adminArea as Area)
      ? (adminArea as Area)
      : "Cultura";
      
  const [tasks, setTasks] = useState<AreaTask[]>(area_tasks);
  
  // Corrección quirúrgica: fallback seguro si la lista mock está vacía
  const [form, setForm] = useState({ 
    title: "", 
    assignee: collaborators.length > 0 ? (collaborators[0]?.email || "") : (user?.email || "Sin asignar"), 
    due: "" 
  });

  const filtered = canViewAllTaskAreas
    ? tasks
    : tasks.filter(t => t.area === scopedArea);

  const add = () => {
    if (!canManageTasks) {
      toast.error("No tenés permisos.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Falta el título.");
      return;
    }

    if (!form.due) {
      toast.error("Seleccioná una fecha.");
      return;
    }
    
    setTasks([{ id: String(Date.now()), area: scopedArea, status: "Pendiente", ...form }, ...tasks]);
    setForm({ 
      title: "", 
      assignee: collaborators.length > 0 ? (collaborators[0]?.email || "") : (user?.email || "Sin asignar"), 
      due: "" 
    });
  };

  const toggle = (id: string) => {
    if (!canManageTasks) return;
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: t.status === "Hecho" ? "Pendiente" : "Hecho" } : t));
  };
  
  const remove = (id: string) => {
    if (!canDeleteTasks) {
      toast.error("No tenés permisos.");
      return;
    }

    if (!window.confirm("¿Eliminar esta tarea?")) return;

    setTasks((p) => p.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      {canManageTasks && (
        <div className="isa-card p-4">
          <h3 className="mb-2">Asignar tarea · {scopedArea}</h3>
          <div className="space-y-2">
            <input 
              placeholder="Título de la tarea" 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm" 
            />
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={form.assignee} 
                onChange={(e) => setForm({ ...form, assignee: e.target.value })} 
                className="px-3 py-2.5 rounded-xl border bg-background text-sm"
              >
                {/* Corrección quirúrgica P2: Fallback de seguridad ante ausencia de mock data */}
                {collaborators.length > 0 ? (
                  collaborators
                    .filter((c) => canViewAllTaskAreas || c.area === scopedArea)
                    .map((c) => (
                      <option key={c.id} value={c.email}>
                        {c.email}
                      </option>
                    ))
                ) : (
                  <option value={user?.email || ""}>{user?.email || "Sin asignar"}</option>
                )}
              </select>
              <input 
                type="date" 
                value={form.due} 
                onChange={(e) => setForm({ ...form, due: e.target.value })} 
                className="px-3 py-2.5 rounded-xl border bg-background text-sm" 
              />
            </div>
            <button
              onClick={add}
              className="w-full bg-isa-navy text-isa-white rounded-[20px] py-2.5 font-bold text-sm flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Asignar
            </button>  
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin tareas activas.</p>}
        {filtered.map((t) => (
          <div key={t.id} className="isa-card p-3 flex items-center gap-3">
            {canManageTasks ? (
              <button onClick={() => toggle(t.id)}>
                {t.status === "Hecho"
                  ? <CheckCircle2 className="w-5 h-5 text-muno-teal" />
                  : <Circle className="w-5 h-5 text-muted-foreground" />}
              </button>
            ) : (
              t.status === "Hecho"
                ? <CheckCircle2 className="w-5 h-5 text-muno-teal" />
                : <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-bold text-isa-navy ${t.status === "Hecho" ? "line-through opacity-60" : ""}`}>{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.assignee} · vence {t.due}</div>
            </div>
            {canDeleteTasks && (
              <button
                onClick={() => remove(t.id)}
                className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muno-red/10 text-muno-red"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}