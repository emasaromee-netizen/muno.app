import { useEffect, useState, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";

type Notif = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  audience: string;
  created_at: string;
};

const STORAGE_KEY = "muno.guest.notif.reads";

function getGuestReads(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function addGuestRead(id: string) {
  const arr = getGuestReads();
  if (!arr.includes(id)) {
    arr.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-200)));
  }
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const { role } = useRole();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const audienceFilter = role === "turista" ? ["tourists", "both"] : ["residents", "both"];

  const load = async () => {
    let query = supabase
      .from("notifications")
      .select("id,title,body,link,audience,created_at,user_id" as any)
      .order("created_at", { ascending: false })
      .limit(30);
    if (user) {
      query = query.or(`user_id.eq.${user.id},and(user_id.is.null,audience.in.(${audienceFilter.join(",")}))`);
    } else {
      query = query.is("user_id", null).in("audience", audienceFilter);
    }
    const { data } = await query;
    setItems((data as any) || []);

    if (user) {
      const { data: reads } = await supabase
        .from("notification_reads" as any)
        .select("notification_id")
        .eq("user_id", user.id);
      setReadIds(new Set((reads || []).map((r: any) => r.notification_id)));
    } else {
      setReadIds(new Set(getGuestReads()));
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("notif_bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((n) => !readIds.has(n.id));
  const unreadCount = unread.length;

  const markRead = async (id: string) => {
    setReadIds((s) => new Set(s).add(id));
    if (user) {
      await supabase.from("notification_reads" as any).upsert(
        { user_id: user.id, notification_id: id },
        { onConflict: "user_id,notification_id" } as any,
      );
    } else {
      addGuestRead(id);
    }
  };

  const markAllRead = async () => {
    const ids = unread.map((n) => n.id);
    setReadIds((s) => {
      const ns = new Set(s);
      ids.forEach((i) => ns.add(i));
      return ns;
    });
    if (user && ids.length) {
      await supabase
        .from("notification_reads" as any)
        .upsert(
          ids.map((id) => ({ user_id: user.id, notification_id: id })),
          { onConflict: "user_id,notification_id" } as any,
        );
    } else {
      ids.forEach(addGuestRead);
    }
  };

  const onItemClick = async (n: Notif) => {
    await markRead(n.id);
    if (n.link) {
      if (n.link.startsWith("http") || n.link.startsWith("tel:") || n.link.startsWith("mailto:")) {
        window.location.href = n.link;
      } else {
        nav(n.link);
      }
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-isa-light transition-colors"
      >
        <Bell strokeWidth={1.8} className="w-5 h-5 text-isa-navy" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-muno-red text-white text-[10px] font-extrabold grid place-items-center ring-2 ring-card"
            aria-label={`${unreadCount} no leídas`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[92vw] bg-card border rounded-[16px] shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-isa-light/40">
            <div className="font-extrabold text-isa-navy text-sm">Notificaciones</div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] font-bold text-muno-blue">
                  Marcar todo leído
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Cerrar">
                <X strokeWidth={2} className="w-4 h-4 text-isa-navy" />
              </button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                Sin notificaciones por ahora.
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const isUnread = !readIds.has(n.id);
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => onItemClick(n)}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-isa-light/40 transition-colors ${
                          isUnread ? "bg-isa-light/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isUnread && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-muno-red shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-isa-navy text-[13px] leading-tight">{n.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {new Date(n.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                            </div>
                            {n.body && (
                              <p className="text-[12px] text-isa-navy/80 mt-1 line-clamp-2">{n.body}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
