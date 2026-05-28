import { useState } from "react";
import { useBanners, type BannerColor, type CustomBanner } from "@/context/BannersContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Sparkles, Send } from "lucide-react";

const COLORS: { id: BannerColor; label: string; hex: string }[] = [
  { id: "navy", label: "Navy", hex: "#242E44" },
  { id: "red", label: "Rojo", hex: "#EF4444" },
  { id: "emerald", label: "Verde", hex: "#10B981" },
];

function BannerForm({
  title,
  value,
  onChange,
  lockedColor,
  icon: Icon,
}: {
  title: string;
  value: CustomBanner | null;
  onChange: (b: CustomBanner) => Promise<void> | void;
  lockedColor?: BannerColor;
  icon: any;
}) {
  const [draft, setDraft] = useState<CustomBanner | null>(value);
  const [saving, setSaving] = useState(false);

  // sync external changes
  if (value && (!draft || draft.id !== value.id)) {
    // initialize once when value loads
    if (!draft) setTimeout(() => setDraft(value), 0);
  }

  if (!draft) {
    return <div className="isa-card p-4 h-32 animate-pulse bg-muted/30" />;
  }

  return (
    <div className="isa-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-[12px] grid place-items-center text-isa-white"
          style={{ background: COLORS.find((c) => c.id === draft.color)?.hex }}
        >
          <Icon strokeWidth={1.5} className="w-5 h-5" />
        </div>
        <h3 className="text-[16px]">{title}</h3>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Título</label>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="w-full rounded-[16px] border border-border bg-card px-4 py-2.5 text-sm"
          maxLength={70}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Descripción</label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={3}
          className="w-full rounded-[16px] border border-border bg-card px-4 py-2.5 text-sm resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Imagen (URL)</label>
        <input
          value={draft.image || ""}
          onChange={(e) => setDraft({ ...draft, image: e.target.value })}
          placeholder="https://…"
          className="w-full rounded-[16px] border border-border bg-card px-4 py-2.5 text-sm"
        />
      </div>

      {!lockedColor && (
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setDraft({ ...draft, color: c.id })}
                className={`flex-1 rounded-[16px] py-2.5 text-xs font-bold border-2 transition-all ${
                  draft.color === c.id ? "border-isa-navy" : "border-transparent"
                }`}
                style={{ background: c.hex, color: "#fff" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Destinatarios</label>
        <div className="flex gap-2">
          {(["residents", "tourists", "both"] as const).map((aud) => (
            <button
              key={aud}
              onClick={() => setDraft({ ...draft, audience: aud })}
              className={`flex-1 rounded-[16px] py-2 text-xs font-bold border-2 transition-all ${
                (draft.audience || "residents") === aud ? "border-isa-navy bg-isa-navy text-white" : "border-border bg-card text-isa-navy"
              }`}
            >
              {aud === "residents" ? "Vecinos" : aud === "tourists" ? "Turistas" : "Ambos"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onChange(draft);
              toast({ title: "Banner publicado", description: "Visible en la home de los vecinos." });
            } finally {
              setSaving(false);
            }
          }}
          className="flex-1 bg-isa-navy text-isa-white rounded-[16px] py-3 text-sm font-bold disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Publicar cambios"}
        </button>
        <button
          type="button"
          onClick={async () => {
            setSaving(true);
            try {
              await onChange(draft);
              toast({
                title: "🔔 Notificación enviada",
                description: `"${draft.title}" llegó a los vecinos del área.`,
              });
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="px-4 bg-muno-red text-white rounded-[16px] text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
          title="Publicar y notificar al celular de los vecinos"
        >
          <Send className="w-4 h-4" /> Enviar push
        </button>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const {
    serviceAlertEnabled,
    setServiceAlertEnabled,
    serviceAlert,
    setServiceAlert,
    cultureBanner,
    setCultureBanner,
  } = useBanners();

  return (
    <div className="space-y-4">
      <div className="isa-card p-4 flex items-start gap-3 bg-isa-light/50">
        <div className="text-[11px] text-isa-navy leading-relaxed">
          <strong>Permisos:</strong> el banner <strong>MUNO</strong> es estático y solo
          puede modificarlo el rol <strong>isa_super_admin</strong>. Los administradores
          municipales pueden editar libremente los banners locales (foto, texto y color
          de fondo de las alertas).
        </div>
      </div>

      <div className="isa-card p-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px]">Banner de aviso (Servicio)</h3>
          <p className="text-[12px] text-muted-foreground">
            Mostrar el aviso rojo en el home de vecinos.
          </p>
        </div>
        <Switch checked={serviceAlertEnabled} onCheckedChange={(v) => setServiceAlertEnabled(v)} />
      </div>

      <BannerForm
        title="Aviso de Servicio"
        value={serviceAlert}
        onChange={setServiceAlert}
        icon={AlertTriangle}
      />

      <BannerForm
        title="Cultura / Deporte"
        value={cultureBanner}
        onChange={setCultureBanner}
        icon={Sparkles}
      />
    </div>
  );
}
