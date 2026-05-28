import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * Forces immersive fullscreen layout for the Intendente dashboard.
 * - Attempts to auto-request fullscreen on mount (may be blocked by the browser).
 * - Shows an elegant floating CTA in the top-right corner if not yet in fullscreen.
 * - Injects scoped CSS so the AdminShell main area uses 100% width (no max-w-7xl).
 */
export default function MayorFullscreen() {
  const [isFs, setIsFs] = useState<boolean>(
    typeof document !== "undefined" && !!document.fullscreenElement
  );

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    // Try to auto-enter fullscreen. Most browsers require a user gesture and
    // will reject this silently; the floating CTA is the fallback.
    const t = setTimeout(() => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    }, 250);
    return () => {
      clearTimeout(t);
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

  const enter = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* noop */
    }
  };
  const exit = async () => {
    try {
      await document.exitFullscreen();
    } catch {
      /* noop */
    }
  };

  return (
    <>
      {/* Inmersive layout: remove the AdminShell content max-width while mounted */}
      <style>{`
        main > .max-w-7xl { max-width: 100% !important; }
        main { padding-left: 1rem !important; padding-right: 1rem !important; }
        @media (min-width: 1280px) {
          main { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
        }
      `}</style>

      {!isFs ? (
        <button
          onClick={enter}
          className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-extrabold text-white shadow-xl shadow-isa-navy/30 hover:shadow-2xl hover:scale-[1.02] transition-all"
          style={{
            background: "linear-gradient(135deg,#242E44,#1A56F0)",
            letterSpacing: "0.04em",
          }}
          aria-label="Activar modo pantalla completa"
        >
          <Maximize2 className="w-4 h-4" strokeWidth={2} />
          Activar Modo Pantalla Completa
        </button>
      ) : (
        <button
          onClick={exit}
          className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-bold text-isa-navy bg-white/90 backdrop-blur border shadow-md hover:bg-white transition-all"
          aria-label="Salir de pantalla completa"
        >
          <Minimize2 className="w-3.5 h-3.5" strokeWidth={2} />
          Salir de pantalla completa
        </button>
      )}
    </>
  );
}
