import { workshops } from "@/data/mock";
import { Download } from "lucide-react";

const MOCK_REGS = [
  { name: "María García", email: "maria@example.com", workshop: "Guitarra Inicial" },
  { name: "Juan López", email: "juan@example.com", workshop: "Guitarra Inicial" },
  { name: "Lucía Méndez", email: "lucia@example.com", workshop: "Pintura al Óleo" },
];

export default function AdminCultura() {
  const exportCsv = () => {
    const rows = [["Nombre", "Email", "Taller"], ...MOCK_REGS.map((r) => [r.name, r.email, r.workshop])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inscriptos-cultura.csv";
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{MOCK_REGS.length} inscriptos · {workshops.length} talleres</p>
        <button onClick={exportCsv} className="bg-isa-navy text-isa-white px-4 py-2.5 rounded-[20px] font-bold flex items-center gap-2">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>
      <div className="isa-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-isa-navy">
            <tr><th className="text-left p-4">Nombre</th><th className="text-left p-4">Email</th><th className="text-left p-4">Taller</th></tr>
          </thead>
          <tbody>
            {MOCK_REGS.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-4 font-bold">{r.name}</td>
                <td className="p-4 text-muted-foreground">{r.email}</td>
                <td className="p-4">{r.workshop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
