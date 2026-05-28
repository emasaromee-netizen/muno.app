import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const KEY = "muno.municipality.v1";

interface Ctx {
  municipality: string; // nombre / zona
  setMunicipality: (m: string) => void;
}

const C = createContext<Ctx>({ municipality: "", setMunicipality: () => {} });

export function MunicipalityProvider({ children }: { children: ReactNode }) {
  const [municipality, setMun] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) || "";
    } catch {
      return "";
    }
  });

  const setMunicipality = (m: string) => {
    setMun(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {}
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setMun(e.newValue || "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <C.Provider value={{ municipality, setMunicipality }}>{children}</C.Provider>;
}

export const useMunicipality = () => useContext(C);
