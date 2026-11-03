export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  dueDate?: string;
  priority?: Priority;
};

export type Priority = "low" | "medium" | "high";
export type Filter = "all" | "active" | "completed";