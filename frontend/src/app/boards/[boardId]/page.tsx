"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { SignInButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { TaskBoard } from "@/components/organisms/TaskBoard";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiBaseUrl } from "@/lib/api-base";

type Board = {
  id: string;
  name: string;
  slug: string;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  due_at?: string | null;
  assigned_agent_id?: string | null;
};

type Agent = {
  id: string;
  name: string;
  board_id?: string | null;
};

type TaskComment = {
  id: string;
  message?: string | null;
  agent_id?: string | null;
  task_id?: string | null;
  created_at: string;
};

const apiBase = getApiBaseUrl();

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function BoardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boardIdParam = params?.boardId;
  const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
  const { getToken, isSignedIn } = useAuth();

  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const titleLabel = useMemo(
    () => (board ? `${board.name} board` : "Board"),
    [board],
  );

  const loadBoard = async () => {
    if (!isSignedIn || !boardId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const [boardResponse, tasksResponse, agentsResponse] = await Promise.all([
        fetch(`${apiBase}/api/v1/boards/${boardId}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }),
        fetch(`${apiBase}/api/v1/boards/${boardId}/tasks`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }),
        fetch(`${apiBase}/api/v1/agents`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }),
      ]);

      if (!boardResponse.ok) {
        throw new Error("Unable to load board.");
      }
      if (!tasksResponse.ok) {
        throw new Error("Unable to load tasks.");
      }
      if (!agentsResponse.ok) {
        throw new Error("Unable to load agents.");
      }

      const boardData = (await boardResponse.json()) as Board;
      const taskData = (await tasksResponse.json()) as Task[];
      const agentData = (await agentsResponse.json()) as Agent[];
      setBoard(boardData);
      setTasks(taskData);
      setAgents(agentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, isSignedIn]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCreateError(null);
  };

  const handleCreateTask = async () => {
    if (!isSignedIn || !boardId) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setCreateError("Add a task title to continue.");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${apiBase}/api/v1/boards/${boardId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          title: trimmed,
          description: description.trim() || null,
          status: "inbox",
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create task.");
      }

      const created = (await response.json()) as Task;
      setTasks((prev) => [created, ...prev]);
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  };

  const assigneeById = useMemo(() => {
    const map = new Map<string, string>();
    agents
      .filter((agent) => !boardId || agent.board_id === boardId)
      .forEach((agent) => {
        map.set(agent.id, agent.name);
      });
    return map;
  }, [agents, boardId]);

  const displayTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        assignee: task.assigned_agent_id
          ? assigneeById.get(task.assigned_agent_id)
          : undefined,
      })),
    [tasks, assigneeById],
  );

  const loadComments = async (taskId: string) => {
    if (!isSignedIn || !boardId) return;
    setIsCommentsLoading(true);
    setCommentsError(null);
    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBase}/api/v1/boards/${boardId}/tasks/${taskId}/comments`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        },
      );
      if (!response.ok) {
        throw new Error("Unable to load comments.");
      }
      const data = (await response.json()) as TaskComment[];
      setComments(data);
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const openComments = (task: Task) => {
    setSelectedTask(task);
    setIsCommentsOpen(true);
    void loadComments(task.id);
  };

  const closeComments = () => {
    setIsCommentsOpen(false);
    setSelectedTask(null);
    setComments([]);
    setCommentsError(null);
  };

  const formatCommentTimestamp = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardShell>
      <SignedOut>
        <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl surface-panel p-10 text-center">
          <p className="text-sm text-muted">Sign in to view boards.</p>
          <SignInButton
            mode="modal"
            forceRedirectUrl="/boards"
            signUpForceRedirectUrl="/boards"
          >
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
            <div className="px-8 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{board?.name ?? "Board"}</span>
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold text-slate-900 tracking-tight">
                    {board?.name ?? "Board"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep tasks moving through your workflow.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
                      Board
                    </button>
                    <button className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900">
                      List
                    </button>
                    <button className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900">
                      Timeline
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/boards")}
                  >
                    Back to boards
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
                Loading {titleLabel}…
              </div>
            ) : (
              <TaskBoard
                tasks={displayTasks}
                onCreateTask={() => setIsDialogOpen(true)}
                isCreateDisabled={isCreating}
                onTaskSelect={openComments}
              />
            )}
          </div>
        </main>
      </SignedIn>

      <Dialog open={isCommentsOpen} onOpenChange={(open) => {
        if (!open) {
          closeComments();
        }
      }}>
        <DialogContent aria-label="Task comments">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title ?? "Task"}</DialogTitle>
            <DialogDescription>
              {selectedTask?.description || "Task details and discussion."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-quiet">
                Comments
              </div>
              {isCommentsLoading ? (
                <p className="text-sm text-muted">Loading comments…</p>
              ) : commentsError ? (
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-muted">
                  {commentsError}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3"
                    >
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>
                          {comment.agent_id
                            ? assigneeById.get(comment.agent_id) ?? "Agent"
                            : "Admin"}
                        </span>
                        <span>{formatCommentTimestamp(comment.created_at)}</span>
                      </div>
                      <p className="mt-2 text-sm text-strong">
                        {comment.message || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeComments}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsDialogOpen(nextOpen);
          if (!nextOpen) {
            resetForm();
          }
        }}
      >
        <DialogContent aria-label={titleLabel}>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Add a task to the inbox and triage it when you are ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-strong">Title</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Prepare launch notes"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-strong">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional details"
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-strong">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createError ? (
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-muted">
                {createError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={isCreating}
            >
              {isCreating ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
