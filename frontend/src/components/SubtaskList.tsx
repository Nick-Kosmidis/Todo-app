import { useState } from "react";
import type { Subtask } from "../types";

interface Props {
  subtasks: Subtask[];
  onAdd: (text: string) => void;
  onToggle: (subtask: Subtask) => void;
  onDelete: (id: string) => void;
}

export default function SubtaskList({ subtasks, onAdd, onToggle, onDelete }: Props) {
  const [text, setText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  }

  return (
    <div className="mt-2 ml-8 space-y-1">
      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.done} onChange={() => onToggle(s)} />
          <span className={s.done ? "flex-1 text-gray-400 line-through" : "flex-1"}>{s.text}</span>
          <button onClick={() => onDelete(s.id)} className="text-gray-400 hover:text-red-600">
            ×
          </button>
        </div>
      ))}
      <form onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add subtask..."
          className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
        />
      </form>
    </div>
  );
}