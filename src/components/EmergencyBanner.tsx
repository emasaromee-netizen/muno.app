import { AlertTriangle } from "lucide-react";

export default function EmergencyBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl p-3 flex items-start gap-2.5 text-white animate-fade-in"
      style={{ background: "hsl(var(--muno-red))" }}
      role="alert"
    >
      <AlertTriangle strokeWidth={2} className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-[13px] font-semibold leading-snug">{message}</p>
    </div>
  );
}
