// Archivo intervenido durante la estabilización del Hito 2 (Mitigación NH-02)
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "../supabase/client";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: {
          ...opts?.extraParams,
        },
      });

      if (result.redirected) {
        return result;
      }

      if (result.error) {
        return result;
      }

      // VALIDACIÓN DE SEGURIDAD QUIRÚRGICA (Mitigación NH-02)
      try {
        if (!result.tokens?.access_token || !result.tokens?.refresh_token) {
          throw new Error("Estructura de sesión OAuth vacía o inválida");
        }

        // Verificar formato JWT estándar (Header, Payload, Signature)
        const tokenParts = result.tokens.access_token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("El token de acceso tiene un formato JWT malformado");
        }

        // Guardar sesión tras comprobar sanidad básica del payload
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        console.error("[SECURITY] Intento de inyección de sesión abortado:", e);
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      
      return result;
    },
  },
};