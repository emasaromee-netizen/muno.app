import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type PreviewRole =
  | "turista"
  | "vecino"
  | "comercio"
  | "municipio"
  | "intendente"
  | "jefe_cultura"
  | "jefe_deporte"
  | "jefe_infraestructura"
  | "isa";

interface PreviewCtx {
  preview: PreviewRole | null;
  setPreview: (r: PreviewRole | null) => void;
}

const Ctx = createContext<PreviewCtx>({ preview: "turista", setPreview: () => {} });

const KEY = "muno.preview";

export const PreviewProvider = ({ children }: { children: ReactNode }) => {
  const [preview, setPreviewState] = useState<PreviewRole | null>(() => {
    if (typeof window === "undefined") return "turista";
    const v = localStorage.getItem(KEY);
    if (v === null) return "turista";
    return v === "" ? null : (v as PreviewRole);
  });

  useEffect(() => {
    if (preview === null) localStorage.setItem(KEY, "");
    else localStorage.setItem(KEY, preview);
  }, [preview]);

  return <Ctx.Provider value={{ preview, setPreview: setPreviewState }}>{children}</Ctx.Provider>;
};

export const usePreview = () => useContext(Ctx);
