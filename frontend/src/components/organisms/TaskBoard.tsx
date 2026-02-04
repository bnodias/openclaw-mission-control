"use client";

import { useMemo } from "react";

import { TaskCard } from "@/components/molecules/TaskCard";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string | null;
  due_at?: string | null;
  assigned_agent_id?: string | null;
  assignee?: string;
};

type TaskBoardProps = {
  tasks: Task[];
  onCreateTask: () => void;
  isCreateDisabled?: boolean;
  onTaskSelect?: (task: Task) => void;
};

const columns = [
  {
    title: "Inbox",
    status: "inbox",
    dot: "bg-slate-400",
    accent: "hover:border-slate-400 hover:bg-slate-50",
    text: "group-hover:text-slate-700 text-slate-500",
  },
  {
    title: "In Progress",
    status: "in_progress",
    dot: "bg-purple-500",
    accent: "hover:border-purple-400 hover:bg-purple-50",
    text: "group-hover:text-purple-600 text-slate-500",
  },
  {
    title: "Review",
    status: "review",
    dot: "bg-indigo-500",
    accent: "hover:border-indigo-400 hover:bg-indigo-50",
    text: "group-hover:text-indigo-600 text-slate-500",
  },
  {
    title: "Done",
    status: "done",
    dot: "bg-green-500",
    accent: "hover:border-green-400 hover:bg-green-50",
    text: "group-hover:text-green-600 text-slate-500",
  },
];

const formatDueDate = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export function TaskBoard({
  tasks,
  onCreateTask,
  isCreateDisabled = false,
  onTaskSelect,
}: TaskBoardProps) {
  const grouped = useMemo(() => {
    const buckets: Record<string, Task[]> = {};
    for (const column of columns) {
      buckets[column.status] = [];
    }
    tasks.forEach((task) => {
      const bucket = buckets[task.status] ?? buckets.inbox;
      bucket.push(task);
    });
    return buckets;
  }, [tasks]);

  return (
    <div className="grid grid-flow-col auto-cols-[minmax(260px,320px)] gap-4 overflow-x-auto pb-6">
      {columns.map((column) => {
        const columnTasks = grouped[column.status] ?? [];
        return (
          <div key={column.title} className="kanban-column min-h-[calc(100vh-260px)]">
            <div className="column-header sticky top-0 z-10 rounded-t-xl border border-b-0 border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", column.dot)} />
                  <h3 className="text-sm font-semibold text-slate-900">
                    {column.title}
                  </h3>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {columnTasks.length}
                </span>
              </div>
            </div>
            <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-3">
              {column.status === "inbox" ? (
                <button
                  type="button"
                  onClick={onCreateTask}
                  disabled={isCreateDisabled}
                  className={cn(
                    "group mb-3 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-medium transition",
                    column.accent,
                    isCreateDisabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  <div className={cn("flex items-center gap-2", column.text)}>
                    <span className="text-sm font-medium">New task</span>
                  </div>
                </button>
              ) : null}
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    status={column.status}
                    assignee={task.assignee}
                    due={formatDueDate(task.due_at)}
                    onClick={() => onTaskSelect?.(task)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
