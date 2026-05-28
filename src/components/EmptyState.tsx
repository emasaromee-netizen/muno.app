import { Inbox, type LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: { icon?: LucideIcon; title: string; description?: string }) {
  return (
    <div className="empty-state">
      <Icon strokeWidth={1.5} className="w-10 h-10 text-isa-navy/60" />
      <div className="text-lg font-bold text-isa-navy">{title}</div>
      {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
    </div>
  );
}
