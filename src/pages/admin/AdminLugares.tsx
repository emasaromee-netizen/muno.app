import { useState } from "react";
import { places as initial } from "@/data/mock";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function AdminLugares() {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<any>(null);

  const save = (data: any) => {
    if (data.id) setItems((p) => p.map((x) => x.id === data.id ? data : x));
    else setItems((p) => [...p, { ...data, id: String(Date.now()) }]);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} lugares cargados</p>
        <button onClick={() => setEditing({ name: "", type: "", photo_url: "", address: "", how_to_get: "" })} className="bg-isa-navy text-isa-white px-4 py-2.5 rounded-[20px] font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo lugar
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Sin lugares cargados" description="Agregá el primero para empezar." />
      ) : (
        <div className="isa-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-isa-navy">
              <tr><th className="text-left p-4">Nombre</th><th className="text-left p-4">Tipo</th><th className="text-left p-4">Dirección</th><th className="p-4 w-28"></th></tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-4 font-bold">{p.name}</td>
                  <td className="p-4">{p.type}</td>
                  <td className="p-4 text-muted-foreground">{p.address}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => setEditing(p)} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setItems(items.filter((x) => x.id !== p.id))} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muno-red/10 text-muno-red"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function EditModal({ item, onClose, onSave }: any) {
  const [form, setForm] = useState(item);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 animate-fade-in">
      <div className="isa-card p-6 max-w-lg w-full animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-extrabold text-isa-navy">{item.id ? "Editar lugar" : "Nuevo lugar"}</h3>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {["name", "type", "address", "photo_url", "how_to_get"].map((k) => (
            <input key={k} placeholder={k} value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-isa-navy" />
          ))}
        </div>
        <button onClick={() => onSave(form)} className="mt-5 w-full bg-isa-navy text-isa-white rounded-[20px] py-3 font-bold">Guardar</button>
      </div>
    </div>
  );
}
