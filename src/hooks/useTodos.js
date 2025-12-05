import { useState, useEffect, useCallback } from "react";
import { pb } from "../lib/pocketbase";
import { useAuth } from "../context/AuthContext"; // Geändert
import { formatError } from "../lib/utils";

export function useTodos() {
  const { user } = useAuth(); // Geändert: useAuth statt useAuthStore
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimierte Abfrage: getList statt getFullList, Server-Side Filter & Sort
  const fetchTodos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Sort: -status (open kommt alphabetisch nach done, also minus für "open first"), -created (neueste zuerst)
      // Filter: Eigene oder geteilte Todos
      const result = await pb.collection("todos").getList(1, 200, {
        sort: "-status,-created",
        filter: `owner = "${user.id}" || shared = true`,
      });
      setTodos(result.items);
    } catch (err) {
      console.error(err);
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = async (title, isShared) => {
    const data = {
      title,
      status: "open",
      shared: isShared,
      owner: user.id,
    };
    try {
      const record = await pb.collection("todos").create(data);
      setTodos((prev) => [record, ...prev]);
      return { success: true };
    } catch (err) {
      const msg = formatError(err);
      // ❌ setError(msg);
      return { success: false, error: msg };
    }
  };

  const toggleTodo = async (id, currentStatus) => {
    const newStatus = currentStatus === "open" ? "done" : "open";

    // Optimistic UI Update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      await pb.collection("todos").update(id, { status: newStatus });
      return { success: true };
    } catch (err) {
      // Rollback
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: currentStatus } : t))
      );
      const msg = formatError(err);
      // ❌ setError(msg);
      return { success: false, error: msg };
    }
  };

  const deleteTodo = async (id) => {
    const prevTodos = [...todos];
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await pb.collection("todos").delete(id);
      return { success: true };
    } catch (err) {
      setTodos(prevTodos);
      const msg = formatError(err);
      // ❌ setError(msg);
      return { success: false, error: msg };
    }
  };

  return {
    todos,
    loading,
    error,
    refetch: fetchTodos,
    createTodo,
    toggleTodo,
    deleteTodo,
  };
}
