import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; title: string; body: string; created_at: string };

export default function StaffNewsWidget() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("staff_announcements" as any)
        .select("id,title,body,created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      setRows((data as any) || []);
    };
    load();
    const ch = supabase
      .channel("staff_ann_widget")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_announcements" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <div className="bg-white border rounded-[16px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-isa-navy text-white grid place-items-center">
            <Bell className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <h3 className="font-extrabold text-isa-navy text-sm">Novedades del Intendente</h3>
        </div>
        <Link to="/admin/novedades" className="text-[11px] font-bold text-muno-blue inline-flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="border-l-2 border-isa-navy pl-3 py-1">
            <div className="font-bold text-isa-navy text-sm">{r.title}</div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString("es-AR")}
            </div>
            <p className="text-xs text-isa-navy mt-1 line-clamp-2">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
