import { useRole, ROLE_LABEL, type Role } from "@/context/RoleContext";
import { UserCog } from "lucide-react";

const ROLES: Role[] = ["admin", "vecino", "turista", "comercio", "encargado_comercio"];

export default function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <div className="fixed bottom-5 right-5 z-50 isa-card shadow-lg p-2 flex items-center gap-1 animate-fade-in flex-wrap max-w-[360px]">
      <div className="px-2 flex items-center gap-1.5 text-[10px] font-bold text-isa-navy">
        <UserCog strokeWidth={1.5} className="w-4 h-4" /> DEMO
      </div>
      {ROLES.map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
            role === r ? "bg-isa-navy text-isa-white" : "text-isa-navy hover:bg-muted"
          }`}
        >
          {ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}
