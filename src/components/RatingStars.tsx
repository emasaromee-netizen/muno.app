import { useState } from "react";
import { Star } from "lucide-react";
import { initial_ratings } from "@/data/mock";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import LeadDialog from "./LeadDialog";
import { useRole } from "@/context/RoleContext";

export default function RatingStars({ id, name }: { id: string; name: string }) {
  const { role } = useRole();
  const [ratings, setRatings] = useState<number[]>(initial_ratings[id] || []);
  const [askEmail, setAskEmail] = useState<number | null>(null);
  const [hover, setHover] = useState(0);

  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

  const handleClick = (n: number) => {
    if (role === "vecino" || role === "admin") {
      apply(n);
    } else {
      setAskEmail(n);
    }
  };

  const apply = (n: number, meta?: any) => {
    setRatings((r) => [...r, n]);
    track({ kind: "rating", meta: { id, name, value: n, ...meta } });
    toast.success("¡Gracias por tu valoración!");
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => handleClick(n)}
              className="p-0.5"
              aria-label={`${n} estrellas`}
            >
              <Star
                strokeWidth={1.5}
                className={`w-4 h-4 ${(hover || Math.round(avg)) >= n ? "fill-[hsl(var(--muno-amber))] text-[hsl(var(--muno-amber))]" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground font-bold">
          {avg ? avg.toFixed(1) : "—"} ({ratings.length})
        </span>
      </div>

      <LeadDialog
        open={askEmail !== null}
        title="Calificar este lugar"
        description="Dejanos tu email para registrar la valoración."
        fields={["email"]}
        kind="rating"
        meta={{ id, name, value: askEmail }}
        onClose={() => setAskEmail(null)}
        onSuccess={({ email }) => apply(askEmail!, { email })}
      />
    </>
  );
}
