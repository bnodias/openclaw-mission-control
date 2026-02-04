import { CalendarClock, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  status: string;
  assignee?: string;
  due?: string;
  onClick?: () => void;
}

export function TaskCard({
  title,
  status,
  assignee,
  due,
  onClick,
}: TaskCardProps) {
  const statusConfig: Record<
    string,
    { label: string; dot: string; badge: string; text: string }
  > = {
    inbox: {
      label: "Inbox",
      dot: "bg-slate-400",
      badge: "bg-slate-100",
      text: "text-slate-600",
    },
    assigned: {
      label: "Assigned",
      dot: "bg-blue-500",
      badge: "bg-blue-50",
      text: "text-blue-700",
    },
    in_progress: {
      label: "In progress",
      dot: "bg-purple-500",
      badge: "bg-purple-50",
      text: "text-purple-700",
    },
    testing: {
      label: "Testing",
      dot: "bg-amber-500",
      badge: "bg-amber-50",
      text: "text-amber-700",
    },
    review: {
      label: "Review",
      dot: "bg-indigo-500",
      badge: "bg-indigo-50",
      text: "text-indigo-700",
    },
    done: {
      label: "Done",
      dot: "bg-green-500",
      badge: "bg-green-50",
      text: "text-green-700",
    },
  };

  const config = statusConfig[status] ?? {
    label: status,
    dot: "bg-slate-400",
    badge: "bg-slate-100",
    text: "text-slate-600",
  };

  return (
    <div
      className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              config.badge,
              config.text,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
            {config.label}
          </span>
          <p className="text-sm font-medium text-slate-900">{title}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-slate-400" />
          <span>{assignee ?? "Unassigned"}</span>
        </div>
        {due ? (
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-400" />
            <span>{due}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
