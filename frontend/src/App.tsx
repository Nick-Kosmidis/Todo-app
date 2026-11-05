import { useEffect, useState } from "react";
import AddTodo from "./components/AddTodo";
import TodoItem from "./components/TodoItem";
import type { Filter, Todo, Priority } from "./types";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const FILTERS: Filter[] = ["all", "active", "completed"];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    async function loadTodos() {
      try {
        const response = await fetch("http://localhost:3000/api/todos");
        if (!response.ok) {
          throw new Error("Failed to fetch todos");
        }
        const todosData: Todo[] = await response.json();
        setTodos(todosData);
      } catch (error) {
        console.error("Failed to fetch todos:", error);
      }
    }
    loadTodos();
  }, []);

  const [filter, setFilter] = useState<Filter>("all");
  const [sortOption, setSortOption] = useState<"none" | "high" | "low" | "dueDate">("none");
  
  const dragDisabled = sortOption !== "none";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

async function addTodo(text: string, priority?: Priority, dueDate?: string) {
  try {
    const response = await fetch("http://localhost:3000/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        priority,
        dueDate
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to create todo");
    }

    const savedTodo: Todo = await response.json();
    setTodos([savedTodo, ...todos]);
  } catch (error) {
    console.error("Failed to add todo:", error);
  }
}

  function toggleTodo(id: string) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function editTodo(id: string, text: string) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, text } : t)));
  }

  function editTodoDetails(
    id: string,
    details: { priority: Priority | undefined; dueDate: string | undefined },
  ) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, ...details } : t)));
  }

  function deleteTodo(id: string) {
    setTodos(todos.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos(todos.filter((t) => !t.done));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const priorityOrder: Record<Priority, number> = { low: 1, medium: 2, high: 3 };

  const sortedTodos = [...todos].sort((a, b) => {
    if (sortOption === "none") {
      return 0;
    }
    else if (sortOption === "high" || sortOption === "low") {
      const weightA = a.priority ? priorityOrder[a.priority] : 0;
      const weightB = b.priority ? priorityOrder[b.priority] : 0;
      return sortOption === "high" ? weightB - weightA : weightA - weightB;
    } else if (sortOption === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  const visible = sortedTodos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="mx-auto mt-12 max-w-3xl px-4">
      <h1 className="mb-6 text-3xl font-bold">Todo List</h1>

      <AddTodo onAdd={addTodo} />

      <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>
          {remaining} item{remaining === 1 ? "" : "s"} left
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-2 py-1 capitalize ${
                  filter === f ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-gray-600" htmlFor="todo-sort">
            Sort by
            <select
              id="todo-sort"
              value={sortOption}
              onChange={(e) =>
                setSortOption(e.target.value as "none" | "high" | "low" | "dueDate")
              }
              className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900"
            >
              <option value="none">None</option>
              <option value="high">Priority (High to Low)</option>
              <option value="low">Priority (Low to High)</option>
              <option value="dueDate">Due date</option>
            </select>
          </label>
          <button onClick={clearCompleted} className="text-gray-500 hover:text-gray-800">
            Clear completed
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {visible.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                dragDisabled={dragDisabled}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
                onEditDetails={editTodoDetails}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {visible.length === 0 && (
        <p className="mt-6 text-center text-gray-400">Nothing here yet.</p>
      )}
    </main>
  );
}