import { useEffect, useState } from "react";

const NEWS = [
  {
    tag: "Cultura",
    title: "¡Nueva Agenda Cultural!",
    body: "Conocé los eventos del mes en San Luis.",
    color: "hsl(var(--isa-navy))",
  },
  {
    tag: "Deporte",
    title: "Abrieron las inscripciones",
    body: "Fútbol Infantil y Yoga Adultos · cupos limitados.",
    color: "hsl(var(--muno-teal))",
  },
];

export default function NewsCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % NEWS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {NEWS.map((n, idx) => (
            <div key={idx} className="w-full shrink-0 p-4 text-white" style={{ background: n.color }}>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">{n.tag}</div>
              <div className="text-base font-extrabold mt-1">{n.title}</div>
              <p className="text-[13px] opacity-90 mt-0.5">{n.body}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5">
        {NEWS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-isa-navy" : "w-1.5 bg-isa-navy/30"}`}
            aria-label={`Ir a noticia ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
