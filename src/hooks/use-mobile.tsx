import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // FIX: Inicialización sincrónica para evitar parpadeos (Layout Thrashing)
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Ya no hace falta la doble negación (!!) porque el estado es estrictamente boolean
  return isMobile; 
}