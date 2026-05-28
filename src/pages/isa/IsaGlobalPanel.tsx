import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Store, AlertCircle, Megaphone, FileText, ChevronDown, LogOut, Pencil, Save, X, Plus, Mail, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Municipality = { id: string; slug: string; name: string; province: string | null; is_default: boolean };
type Counts = { users: number; businesses: number; claims: number; banners: number };

export default function IsaGlobalPanel() {
  const { signOut, user } = useAuth();
  const [munis, setMunis] = useState<Municipality[]>([]);
  // Form: nuevo municipio
  const [newName, setNewName] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [newMayorEmail, setNewMayorEmail] = useState("");
  const [creating, setCreating] = useState(false);
  // Form: colaborador municipio
  const [collabEmail, setCollabEmail] = useState("");
  const [collabRole, setCollabRole] = useState<"admin" | "area_manager">("area_manager");
  const [collabArea, setCollabArea] = useState("Cultura");
  const [collabBusy, setCollabBusy] = useState(false);
  const [muniInvites, setMuniInvites] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("ALL");
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [loading, setLoading] = useState(true);

  // Banners / novedades del municipio seleccionado
  const [banners, setBanners] = useState<any[]>([]);
  const [internal, setInternal] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("municipalities").select("*").order("name");
      setMunis(data || []);
    })();
  }, []);

  useEffect(() => {
    if (munis.length === 0) return;
    (async () => {
      setLoading(true);
      const out: Record<string, Counts> = {};
      for (const m of munis) {
        const [u, b, c, an] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("municipality_id", m.id),
          supabase.from("businesses").select("id", { count: "exact", head: true }).eq("municipality_id", m.id),
          supabase.from("claims").select("id", { count: "exact", head: true }).eq("municipality_id", m.id),
          supabase.from("announcements").select("id", { count: "exact", head: true }).eq("municipality_id", m.id),
        ]);
        out[m.id] = {
          users: u.count ?? 0,
          businesses: b.count ?? 0,
          claims: c.count ?? 0,
          banners: an.count ?? 0,
        };
      }
      setCounts(out);
      setLoading(false);
    })();
  }, [munis]);

  const totals = useMemo<Counts>(() => {
    const acc: Counts = { users: 0, businesses: 0, claims: 0, banners: 0 };
    Object.values(counts).forEach((c) => {
      acc.users += c.users; acc.businesses += c.businesses; acc.claims += c.claims; acc.banners += c.banners;
    });
    return acc;
  }, [counts]);

  // Cargar banners del municipio seleccionado
  useEffect(() => {
    if (selected === "ALL") { setBanners([]); setInternal(null); return; }
    (async () => {
      const [{ data: bs }, { data: ia }] = await Promise.all([
        supabase.from("announcements").select("*").eq("municipality_id", selected).order("order_index"),
        supabase.from("internal_announcements").select("*").eq("municipality_id", selected).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setBanners(bs || []);
      setInternal(ia || null);
    })();
  }, [selected]);

  const saveBanner = async (id: string) => {
    const { error } = await supabase.from("announcements").update({ description: draft }).eq("id", id);
    if (!error) {
      setBanners((bs) => bs.map((b) => (b.id === id ? { ...b, description: draft } : b)));
      setEditId(null);
    }
  };

  const saveInternal = async () => {
    if (internal?.id) {
      await supabase.from("internal_announcements").update({ message: draft }).eq("id", internal.id);
      setInternal({ ...internal, message: draft });
    } else {
      const { data } = await supabase.from("internal_announcements").insert({ message: draft, municipality_id: selected }).select().single();
      if (data) setInternal(data);
    }
    setEditId(null);
  };

  const currentMuni = munis.find((m) => m.id === selected);

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const createMunicipality = async () => {
    if (!newName.trim()) {
      toast.error("Ingresá el nombre del municipio");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newMayorEmail)) {
      toast.error("Email del Intendente inválido");
      return;
    }
    setCreating(true);
    const slug = slugify(newName);
    const { data: muni, error: muniErr } = await supabase
      .from("municipalities")
      .insert({ name: newName.trim(), province: newProvince.trim() || null, slug, enabled: true })
      .select()
      .single();
    if (muniErr || !muni) {
      setCreating(false);
      toast.error("No se pudo crear el municipio", { description: muniErr?.message });
      return;
    }
    const { error: invErr } = await supabase.from("municipal_invitations").insert({
      email: newMayorEmail.trim().toLowerCase(),
      role: "admin",
      area: null,
      municipality_id: muni.id,
      invited_by: user?.id,
      invited_by_email: user?.email,
    });
    setCreating(false);
    if (invErr) {
      toast.error("Municipio creado, pero falló la invitación", { description: invErr.message });
    } else {
      toast.success(`${newName} creado · invitación enviada al Intendente`);
    }
    setNewName(""); setNewProvince(""); setNewMayorEmail("");
    const { data } = await supabase.from("municipalities").select("*").order("name");
    setMunis(data || []);
    setSelected(muni.id);
  };

  const loadMuniInvites = async (muniId: string) => {
    const { data } = await supabase
      .from("municipal_invitations")
      .select("*")
      .eq("municipality_id", muniId)
      .order("created_at", { ascending: false });
    setMuniInvites(data || []);
  };

  useEffect(() => {
    if (selected !== "ALL") loadMuniInvites(selected);
    else setMuniInvites([]);
  }, [selected]);

  const addCollaborator = async () => {
    if (selected === "ALL") return;
    if (!/\S+@\S+\.\S+/.test(collabEmail)) {
      toast.error("Email inválido");
      return;
    }
    setCollabBusy(true);
    const { error } = await supabase.from("municipal_invitations").insert({
      email: collabEmail.trim().toLowerCase(),
      role: collabRole,
      area: collabRole === "area_manager" ? collabArea : null,
      municipality_id: selected,
      invited_by: user?.id,
      invited_by_email: user?.email,
    });
    setCollabBusy(false);
    if (error) {
      toast.error("No se pudo crear la invitación", { description: error.message });
      return;
    }
    toast.success("Invitación creada");
    setCollabEmail("");
    loadMuniInvites(selected);
  };

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invitacion/${token}`);
    toast.success("Link copiado");
  };

  const removeInvite = async (id: string) => {
    await supabase.from("municipal_invitations").delete().eq("id", id);
    setMuniInvites((xs) => xs.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-isa-light">
      {/* Header sobrio */}
      <header className="border-b border-isa-navy/10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-isa-navy text-white grid place-items-center font-extrabold">ISA</div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-isa-navy/60">Super Admin</div>
              <h1 className="font-display text-[20px] font-extrabold text-isa-navy leading-none">Panel Global ISA</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/isa/panel" className="text-xs font-bold text-isa-navy hover:underline">Informes →</Link>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 text-xs font-bold text-isa-navy/70 hover:text-isa-navy">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Selector */}
        <section>
          <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-isa-navy/60">Municipio</label>
          <div className="relative mt-2 max-w-md">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full appearance-none bg-white border border-isa-navy/15 rounded-xl px-4 py-3 pr-10 font-bold text-isa-navy focus:outline-none focus:ring-2 focus:ring-isa-navy/30"
            >
              <option value="ALL">Todos los municipios (consolidado)</option>
              {munis.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.province ? ` · ${m.province}` : ""}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-isa-navy/50 pointer-events-none" />
          </div>
        </section>

        {/* Sumar nuevo municipio */}
        <section className="bg-white border border-isa-navy/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-isa-navy/70" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-isa-navy">Sumar nuevo municipio</h2>
          </div>
          <p className="text-xs text-isa-navy/60">
            Crea la entidad y dispara una invitación al email del Intendente para que active su acceso.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del municipio"
              className="md:col-span-4 px-3 py-2.5 rounded-xl border bg-background text-sm" />
            <input value={newProvince} onChange={(e) => setNewProvince(e.target.value)} placeholder="Provincia"
              className="md:col-span-3 px-3 py-2.5 rounded-xl border bg-background text-sm" />
            <input value={newMayorEmail} onChange={(e) => setNewMayorEmail(e.target.value)} placeholder="email@intendente.gob.ar" type="email"
              className="md:col-span-5 px-3 py-2.5 rounded-xl border bg-background text-sm" />
          </div>
          <button onClick={createMunicipality} disabled={creating}
            className="w-full md:w-auto bg-isa-navy text-white rounded-xl px-5 py-2.5 text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" /> {creating ? "Creando…" : "Crear municipio + invitar Intendente"}
          </button>
        </section>

        {/* Colaboradores por municipio (solo cuando se selecciona uno) */}
        {selected !== "ALL" && currentMuni && (
          <section className="bg-white border border-isa-navy/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-isa-navy/70" />
              <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-isa-navy">
                Colaboradores · {currentMuni.name}
              </h2>
            </div>
            <p className="text-xs text-isa-navy/60">Descentralizá agregando jefes de área o nuevos administradores.</p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <input value={collabEmail} onChange={(e) => setCollabEmail(e.target.value)} placeholder="email@municipio.gob.ar" type="email"
                className="md:col-span-5 px-3 py-2.5 rounded-xl border bg-background text-sm" />
              <select value={collabRole} onChange={(e) => setCollabRole(e.target.value as any)}
                className="md:col-span-3 px-3 py-2.5 rounded-xl border bg-background text-sm">
                <option value="admin">Intendente / Admin</option>
                <option value="area_manager">Jefe de área</option>
              </select>
              <select value={collabArea} onChange={(e) => setCollabArea(e.target.value)} disabled={collabRole !== "area_manager"}
                className="md:col-span-2 px-3 py-2.5 rounded-xl border bg-background text-sm disabled:opacity-40">
                {["Cultura","Turismo","Deporte","Infraestructura","Comercios"].map((a) => <option key={a}>{a}</option>)}
              </select>
              <button onClick={addCollaborator} disabled={collabBusy}
                className="md:col-span-2 bg-isa-navy text-white rounded-xl py-2.5 text-sm font-bold inline-flex items-center justify-center gap-1 disabled:opacity-50">
                <Plus className="w-4 h-4" /> Invitar
              </button>
            </div>
            {muniInvites.length > 0 && (
              <ul className="divide-y divide-isa-navy/5 mt-2">
                {muniInvites.map((inv) => (
                  <li key={inv.id} className="py-2 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-isa-navy/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-isa-navy text-sm truncate">{inv.email}</div>
                      <div className="text-xs text-isa-navy/60">
                        {inv.role === "admin" ? "Intendente / Admin" : `Jefe de ${inv.area}`} · {inv.status}
                      </div>
                    </div>
                    {inv.status !== "accepted" && (
                      <button onClick={() => copyInviteLink(inv.token)}
                        className="text-[11px] font-bold text-muno-blue inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-isa-light">
                        <Copy className="w-3 h-3" /> Link
                      </button>
                    )}
                    <button onClick={() => removeInvite(inv.id)}
                      className="w-8 h-8 grid place-items-center rounded-lg text-muno-red hover:bg-muno-red/10">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={Users}    label="Usuarios"  value={selected === "ALL" ? totals.users      : counts[selected]?.users      ?? 0} loading={loading} />
          <Kpi icon={Store}    label="Comercios" value={selected === "ALL" ? totals.businesses : counts[selected]?.businesses ?? 0} loading={loading} />
          <Kpi icon={AlertCircle} label="Reclamos" value={selected === "ALL" ? totals.claims  : counts[selected]?.claims     ?? 0} loading={loading} />
          <Kpi icon={Megaphone} label="Banners"  value={selected === "ALL" ? totals.banners   : counts[selected]?.banners    ?? 0} loading={loading} />
        </section>

        {/* Tabla por municipio */}
        {selected === "ALL" && (
          <section className="bg-white border border-isa-navy/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-isa-navy/10 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-isa-navy/70" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-isa-navy">Distribución por municipio</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-isa-light/60 text-isa-navy/70">
                <tr>
                  <th className="text-left px-5 py-2 font-semibold">Municipio</th>
                  <th className="text-right px-5 py-2 font-semibold">Usuarios</th>
                  <th className="text-right px-5 py-2 font-semibold">Comercios</th>
                  <th className="text-right px-5 py-2 font-semibold">Reclamos</th>
                  <th className="text-right px-5 py-2 font-semibold">Banners</th>
                </tr>
              </thead>
              <tbody>
                {munis.map((m) => (
                  <tr key={m.id} className="border-t border-isa-navy/5 hover:bg-isa-light/40 cursor-pointer" onClick={() => setSelected(m.id)}>
                    <td className="px-5 py-3 font-bold text-isa-navy">{m.name}<span className="text-isa-navy/50 font-normal"> · {m.province}</span></td>
                    <td className="px-5 py-3 text-right tabular-nums">{counts[m.id]?.users ?? 0}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{counts[m.id]?.businesses ?? 0}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{counts[m.id]?.claims ?? 0}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{counts[m.id]?.banners ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Edición cross-municipio */}
        {selected !== "ALL" && currentMuni && (
          <>
            <section className="bg-white border border-isa-navy/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-4 h-4 text-isa-navy/70" />
                <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-isa-navy">Novedad de Intendencia · {currentMuni.name}</h2>
              </div>
              {editId === "internal" ? (
                <div className="space-y-2">
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} rows={3}
                    className="w-full bg-isa-light/60 border border-isa-navy/15 rounded-xl p-3 text-sm text-isa-navy" />
                  <div className="flex gap-2">
                    <button onClick={saveInternal} className="inline-flex items-center gap-1.5 bg-isa-navy text-white text-xs font-bold rounded-lg px-3 py-2"><Save className="w-3.5 h-3.5" /> Guardar</button>
                    <button onClick={() => setEditId(null)} className="inline-flex items-center gap-1.5 text-xs font-bold text-isa-navy/70 px-3 py-2"><X className="w-3.5 h-3.5" /> Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-isa-navy whitespace-pre-line min-h-[1.5rem]">{internal?.message || <span className="text-isa-navy/40 italic">Sin novedad cargada.</span>}</p>
                  <button onClick={() => { setEditId("internal"); setDraft(internal?.message || ""); }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-isa-navy/70 hover:text-isa-navy shrink-0">
                    <Pencil className="w-3.5 h-3.5" /> {internal ? "Editar" : "Crear"}
                  </button>
                </div>
              )}
            </section>

            <section className="bg-white border border-isa-navy/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-isa-navy/10 flex items-center gap-2">
                <FileText className="w-4 h-4 text-isa-navy/70" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-isa-navy">Banners de {currentMuni.name}</span>
              </div>
              <ul className="divide-y divide-isa-navy/5">
                {banners.length === 0 && <li className="px-5 py-6 text-sm text-isa-navy/50 italic">Este municipio aún no tiene banners.</li>}
                {banners.map((b) => (
                  <li key={b.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-isa-navy">{b.title}</div>
                        {editId === b.id ? (
                          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
                            className="mt-2 w-full bg-isa-light/60 border border-isa-navy/15 rounded-lg p-2 text-sm text-isa-navy" />
                        ) : (
                          <p className="text-xs text-isa-navy/70 mt-0.5 line-clamp-2">{b.description}</p>
                        )}
                      </div>
                      {editId === b.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveBanner(b.id)} className="text-xs font-bold bg-isa-navy text-white rounded-lg px-2 py-1.5"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditId(null)} className="text-xs font-bold text-isa-navy/60 px-2 py-1.5"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditId(b.id); setDraft(b.description); }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-isa-navy/70 hover:text-isa-navy">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, loading }: { icon: any; label: string; value: number; loading: boolean }) {
  return (
    <div className="bg-white border border-isa-navy/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-isa-navy/60">{label}</span>
        <Icon className="w-4 h-4 text-isa-navy/40" />
      </div>
      <div className="mt-3 font-display text-[32px] font-extrabold text-isa-navy tabular-nums leading-none">
        {loading ? <span className="text-isa-navy/30">···</span> : value.toLocaleString("es-AR")}
      </div>
    </div>
  );
}
