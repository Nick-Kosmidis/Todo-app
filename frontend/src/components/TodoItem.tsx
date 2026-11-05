import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo, Priority } from "../types";

type Props = {
  todo: Todo;
  dragDisabled: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDetails: (
    id: string,
    details: { priority: Priority | undefined; dueDate: string | undefined },
  ) => void;
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const OVERTIME_STYLES = "bg-red-100 text-red-800 font-bold";

function toDateInputValue(value?: string) {
  return value?.slice(0, 10) ?? "";
}

export default function TodoItem({
  todo,
  dragDisabled,
  onToggle,
  onDelete,
  onEdit,
  onEditDetails,
}: Props) {
  const { listeners, setNodeRef, transform, transition, isDragging } =
  useSortable({ id: todo.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [editingDetails, setEditingDetails] = useState(false);
  const [priorityDraft, setPriorityDraft] = useState<Priority | "">(
    todo.priority ?? "",
  );
  const [dueDateDraft, setDueDateDraft] = useState(toDateInputValue(todo.dueDate));

  function save() {
    const trimmed = draft.trim();
    if (trimmed) onEdit(todo.id, trimmed);
    else setDraft(todo.text);
    setEditing(false);
  }

  function startEditingDetails() {
    setPriorityDraft(todo.priority ?? "");
    setDueDateDraft(toDateInputValue(todo.dueDate));
    setEditingDetails(true);
  }

  function saveDetails() {
    onEditDetails(todo.id, {
      priority: priorityDraft || undefined,
      dueDate: dueDateDraft || undefined,
    });
    setEditingDetails(false);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateValue = toDateInputValue(todo.dueDate);
  const dueDate = dueDateValue ? new Date(`${dueDateValue}T00:00:00`) : null;
  const isOverdue =
    dueDate !== null &&
    !todo.done &&
    dueDate < today;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
        isOverdue ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <button
      type="button"
      {...listeners}
      disabled={dragDisabled}
      className={`touch-none ${
        dragDisabled
          ? "cursor-not-allowed text-gray-300"
          : "cursor-grab text-gray-400 hover:text-gray-600"
      }`}
      aria-label="Drag to reorder"
    >
      ⋮⋮
    </button>

      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        className="h-4 w-4"
      />

      <div className="min-w-0 flex-1">
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
            className="w-full rounded border border-gray-300 px-2 py-1 outline-none"
          />
        ) : (
          <span
            onDoubleClick={() => setEditing(true)}
            className={`cursor-text ${
              todo.done ? "text-gray-400 line-through" : ""
            }`}
            title="Double-click to edit"
          >
            {todo.text}
          </span>
        )}

        {(todo.priority || todo.dueDate) && (
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {todo.priority && (
              <span
                className={`rounded-full px-2 py-0.5 capitalize ${PRIORITY_STYLES[todo.priority]}`}
              >
                {todo.priority} priority
              </span>
            )}
            {todo.dueDate && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                Due {dueDate?.toLocaleDateString()}
              </span>
            )}
            {isOverdue && (
              <span className={`rounded-full px-2 py-0.5 ${OVERTIME_STYLES}`}>
                Overdue
              </span>
            )}
          </div>
        )}

        {editingDetails && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`priority-${todo.id}`}>
              Priority
            </label>
            <select
              id={`priority-${todo.id}`}
              value={priorityDraft}
              onChange={(e) =>
                setPriorityDraft(e.target.value as Priority | "")
              }
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
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
                value={dueDateDraft}
                onChange={(e) => setDueDateDraft(e.target.value)}
                className="rounded border border-gray-300 bg-white px-2 py-1"
              />
            </label>

            <button
              type="button"
              onClick={saveDetails}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingDetails(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {!editingDetails && (
        <button
          type="button"
          onClick={startEditingDetails}
          className="text-sm text-blue-600 hover:text-blue-800"
          aria-label={`Edit priority and due date for ${todo.text}`}
        >
          Edit details
        </button>
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