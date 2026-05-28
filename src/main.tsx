import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Persistencia del Modo Demo en cualquier dispositivo (celular o PC).
// Se activa por defecto la primera vez y queda fijo en LocalStorage hasta
// que el usuario lo oculte explícitamente desde el switcher.
try {
  const forced = localStorage.getItem("muno.preview.force");
  const hidden = localStorage.getItem("muno.preview.hidden");
  if (forced === null && hidden !== "1") {
    localStorage.setItem("muno.preview.force", "1");
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
