import { sport_activities } from "@/data/mock";

export default function AdminDeporte() {
  return (
    <div className="space-y-5">
      <div className="isa-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-isa-navy">
            <tr><th className="text-left p-4">Actividad</th><th className="text-left p-4">Disciplina</th><th className="text-left p-4">Edad</th><th className="text-left p-4">Horario</th><th className="text-left p-4">Inscriptos</th></tr>
          </thead>
          <tbody>
            {sport_activities.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-4 font-bold">{a.name}</td>
                <td className="p-4">{a.discipline}</td>
                <td className="p-4">{a.age_range}</td>
                <td className="p-4 text-muted-foreground">{a.schedule}</td>
                <td className="p-4"><span className="font-bold text-isa-navy">{a.enrolled}</span><span className="text-muted-foreground">/{a.capacity}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
