import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function FullscreenToggle() {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen no disponible", e);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isFs ? "Salir de pantalla completa" : "Pantalla completa"}
      title={isFs ? "Salir de pantalla completa" : "Pantalla completa"}
      className="inline-flex items-center justify-center w-9 h-9 rounded-xl border bg-card text-isa-navy hover:bg-accent transition-colors"
    >
      {isFs ? <Minimize2 className="w-4 h-4" strokeWidth={2} /> : <Maximize2 className="w-4 h-4" strokeWidth={2} />}
    </button>
  );
}
