import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BannerColor = "navy" | "red" | "emerald";

export type BannerAudience = "residents" | "tourists" | "both";

export interface CustomBanner {
  id: string;
  title: string;
  description: string;
  image?: string;
  color: BannerColor;
  cta?: string;
  ctaTo?: string;
  enabled?: boolean;
  order_index?: number;
  tags?: string[];
  audience?: BannerAudience;
}

interface BannersCtx {
  banners: CustomBanner[];
  loading: boolean;
  reload: () => Promise<void>;
  // legacy/admin-friendly:
  serviceAlertEnabled: boolean;
  setServiceAlertEnabled: (v: boolean) => Promise<void>;
  serviceAlert: CustomBanner | null;
  setServiceAlert: (b: CustomBanner) => Promise<void>;
  cultureBanner: CustomBanner | null;
  setCultureBanner: (b: CustomBanner) => Promise<void>;
}

const Ctx = createContext<BannersCtx | null>(null);

const mapRow = (r: any): CustomBanner => ({
  id: r.id,
  title: r.title,
  description: r.description,
  image: r.image_url || undefined,
  color: r.color,
  cta: r.cta_label || undefined,
  ctaTo: r.cta_to || undefined,
  enabled: r.enabled,
  order_index: r.order_index,
  tags: Array.isArray(r.tags) ? r.tags : [],
  audience: (r.audience as BannerAudience) || "residents",
});

export function BannersProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<CustomBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("order_index", { ascending: true });
    setBanners((data || []).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const serviceAlert = banners.find((b) => b.color === "red") || null;
  const cultureBanner = banners.find((b) => b.color === "emerald") || null;
  const serviceAlertEnabled = serviceAlert?.enabled ?? true;

  const updateBanner = async (b: CustomBanner) => {
    await supabase
      .from("announcements")
      .update({
        title: b.title,
        description: b.description,
        image_url: b.image || null,
        color: b.color,
        cta_label: b.cta || null,
        cta_to: b.ctaTo || null,
        ...(b.audience ? { audience: b.audience } : {}),
      } as any)
      .eq("id", b.id);
    await reload();
  };

  const setServiceAlertEnabled = async (v: boolean) => {
    if (!serviceAlert) return;
    await supabase.from("announcements").update({ enabled: v }).eq("id", serviceAlert.id);
    await reload();
  };

  return (
    <Ctx.Provider
      value={{
        banners,
        loading,
        reload,
        serviceAlertEnabled,
        setServiceAlertEnabled,
        serviceAlert,
        setServiceAlert: updateBanner,
        cultureBanner,
        setCultureBanner: updateBanner,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useBanners = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("BannersProvider missing");
  return c;
};

export const COLOR_BG: Record<BannerColor, string> = {
  navy: "hsl(var(--isa-navy))",
  red: "hsl(var(--muno-red))",
  emerald: "hsl(var(--muno-emerald))",
};
