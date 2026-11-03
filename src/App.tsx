import { useState } from "react";
import AddTodo from "./components/AddTodo";
import TodoItem from "./components/TodoItem";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Filter, Todo } from "./types";

const FILTERS: Filter[] = ["all", "active", "completed"];

export default function App() {
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);
  const [filter, setFilter] = useState<Filter>("all");

  function addTodo(text: string) {
    const todo: Todo = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
    };
    setTodos([todo, ...todos]);
  }

  function toggleTodo(id: string) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function editTodo(id: string, text: string) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, text } : t)));
  }

  function deleteTodo(id: string) {
    setTodos(todos.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos(todos.filter((t) => !t.done));
  }

  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="mx-auto mt-12 max-w-xl px-4">
      <h1 className="mb-6 text-3xl font-bold">Todo List</h1>

      <AddTodo onAdd={addTodo} />

      <div className="my-4 flex items-center justify-between text-sm">
        <span>
          {remaining} item{remaining === 1 ? "" : "s"} left
        </span>
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
        <button onClick={clearCompleted} className="text-gray-500 hover:text-gray-800">
          Clear completed
        </button>
      </div>

      <ul className="space-y-2">
        {visible.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
          />
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="mt-6 text-center text-gray-400">Nothing here yet.</p>
      )}
    </main>
  );
}