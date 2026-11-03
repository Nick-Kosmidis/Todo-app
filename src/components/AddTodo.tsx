import { useState } from "react";
import type { Priority } from "../types";

type Props = {
  onAdd: (text: string, priority?: Priority, dueDate?: string) => void;
};

export default function AddTodo({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority || undefined, dueDate || undefined);
    setText("");
    setPriority("");
    setDueDate("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="min-w-48 flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
      />

      <label className="sr-only" htmlFor="todo-priority">
        Priority
      </label>
      <select
        id="todo-priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority | "")}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
      >
        <option value="">No priority</option>
        <option value="low">Low priority</option>
        <option value="medium">Medium priority</option>
        <option value="high">High priority</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        Due date
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Add
      </button>
    </form>
  );
}