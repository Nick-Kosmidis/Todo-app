import { useState } from "react";
import type { Todo } from "../types";

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
};

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  function save() {
    const trimmed = draft.trim();
    if (trimmed) onEdit(todo.id, trimmed);
    else setDraft(todo.text);
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        className="h-4 w-4"
      />

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(todo.text);
              setEditing(false);
            }
          }}
          className="flex-1 rounded border border-gray-300 px-2 py-1 outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 cursor-text ${
            todo.done ? "text-gray-400 line-through" : ""
          }`}
          title="Double-click to edit"
        >
          {todo.text}
        </span>
      )}

      <button
        onClick={() => onDelete(todo.id)}
        className="text-sm text-red-500 hover:text-red-700"
        aria-label={`Delete ${todo.text}`}
      >
        Delete
      </button>
    </li>
  );
}