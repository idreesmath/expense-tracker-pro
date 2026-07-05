import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** An empty screen is an invitation to act. */
export function EmptyState({
  icon: Icon,
  title,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <Icon className="size-8 text-muted-foreground/60" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}
