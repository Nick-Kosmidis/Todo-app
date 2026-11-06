export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  dueDate?: string;
  priority?: Priority;
  subtasks: Subtask[];
};

export type Priority = "low" | "medium" | "high";
export type Filter = "all" | "active" | "completed";