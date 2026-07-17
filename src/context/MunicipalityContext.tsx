/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY_NAME = "muno.municipality.v1";
const KEY_INFO = "muno.municipality.info.v1";

export interface MunicipalityInfo {
  id: string;
  name: string;
  slug: string;
}

interface Ctx {
  municipality: string;
  municipalityId: string;
  municipalityInfo: MunicipalityInfo | null;
  setMunicipality: (name: string, id?: string) => void;
}

const C = createContext<Ctx>({ 
  municipality: "", 
  municipalityId: "",
  municipalityInfo: null,
  setMunicipality: () => {} 
});

export function MunicipalityProvider({ children }: { children: ReactNode }) {
  const [municipality, setMun] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY_NAME) || "";
    } catch {
      return "";
    }
  });

  const [municipalityInfo, setMunInfo] = useState<MunicipalityInfo | null>(() => {
    try {
      const raw = localStorage.getItem(KEY_INFO);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Resolver el municipio por defecto en el primer montaje si no hay caché
  useEffect(() => {
    let isMounted = true;

    const fetchDefaultMunicipality = async () => {
      if (!municipalityInfo) {
        try {
          const { data } = await supabase
            .from("municipalities")
            .select("id, name, slug")
            .eq("is_default", true)
            .maybeSingle();

          if (data && isMounted) {
            const info: MunicipalityInfo = {
              id: data.id,
              name: data.name,
              slug: data.slug,
            };
            setMun(data.name);
            setMunInfo(info);
            try {
              localStorage.setItem(KEY_NAME, data.name);
              localStorage.setItem(KEY_INFO, JSON.stringify(info));
            } catch (err) {
              console.error(err);
            }
          }
        } catch (error) {
          console.error("Error cargando municipio por defecto:", error);
        }
      }
    };

    fetchDefaultMunicipality();

    return () => {
      isMounted = false;
    };
  }, [municipalityInfo]);

  const setMunicipality = async (name: string, explicitId?: string) => {
    if (!name) {
      setMun("");
      setMunInfo(null);
      try {
        localStorage.removeItem(KEY_NAME);
        localStorage.removeItem(KEY_INFO);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    setMun(name);
    try {
      localStorage.setItem(KEY_NAME, name);
    } catch (err) {
      console.error(err);
    }

    // Si pasamos el ID directamente, evitamos la query y actualizamos caché
    if (explicitId) {
      const info: MunicipalityInfo = {
        id: explicitId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };
      setMunInfo(info);
      try {
        localStorage.setItem(KEY_INFO, JSON.stringify(info));
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Resolver el UUID por nombre una única vez al cambiar de municipio
    const { data } = await supabase
      .from("municipalities")
      .select("id, name, slug")
      .eq("name", name)
      .maybeSingle();

    if (data) {
      const info: MunicipalityInfo = {
        id: data.id,
        name: data.name,
        slug: data.slug,
      };
      setMunInfo(info);
      try {
        localStorage.setItem(KEY_INFO, JSON.stringify(info));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const municipalityId = municipalityInfo?.id || "";

  return (
    <C.Provider value={{ municipality, municipalityId, municipalityInfo, setMunicipality }}>
      {children}
    </C.Provider>
  );
}

// SOLUCIÓN ESLINT: Export default para evitar errores de react-refresh
export default C;
export const useMunicipality = () => useContext(C);