import { useState, useEffect, useCallback } from "react";
import { pb } from "../lib/pocketbase";
import { useAuth } from "../context/AuthContext";
import { formatError, getNextDueDate } from "../lib/utils";

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await pb.collection("todos").getList(1, 200, {
        sort: "-status,-created",
        filter: `owner = "${user.id}" || shared = true`,
        expand: "todo_subtasks_via_todo",
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

  const createTodo = async (data) => {
    const todoData = {
      title: data.title,
      description: data.description || "",
      status: "open",
      shared: data.shared || false,
      owner: user.id,
      due_date: data.due_date || "",
      priority: data.priority || "",
      tags: data.tags || "",
      recurrence: data.recurrence || "none",
    };

    try {
      const record = await pb.collection("todos").create(todoData);
      
      // Subtasks erstellen falls vorhanden
      if (data.subtasks && data.subtasks.length > 0) {
        await Promise.all(
          data.subtasks.map(subtask =>
            pb.collection("todo_subtasks").create({
              todo: record.id,
              title: subtask.title,
              done: false,
            })
          )
        );
      }
      
      await fetchTodos(); // Reload mit expand
      return { success: true };
    } catch (err) {
      const msg = formatError(err);
      return { success: false, error: msg };
    }
  };

  const toggleTodo = async (id, currentStatus) => {
    const todo = todos.find(t => t.id === id);
    const newStatus = currentStatus === "open" ? "done" : "open";

    // Optimistic UI Update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      await pb.collection("todos").update(id, { status: newStatus });
      
      // Wenn auf "done" gesetzt und recurrence aktiv → neues Todo erstellen
      if (newStatus === "done" && todo?.recurrence && todo.recurrence !== "none") {
        const nextDueDate = getNextDueDate(todo.due_date, todo.recurrence);
        
        await pb.collection("todos").create({
          title: todo.title,
          description: todo.description || "",
          status: "open",
          shared: todo.shared,
          owner: user.id,
          due_date: nextDueDate,
          priority: todo.priority || "",
          tags: todo.tags || "",
          recurrence: todo.recurrence,
        });
        
        await fetchTodos(); // Reload für neues Todo
      }
      
      return { success: true };
    } catch (err) {
      // Rollback
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: currentStatus } : t))
      );
      const msg = formatError(err);
      return { success: false, error: msg };
    }
  };

  const updateTodo = async (id, data) => {
    try {
      await pb.collection("todos").update(id, data);
      await fetchTodos();
      return { success: true };
    } catch (err) {
      const msg = formatError(err);
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
      return { success: false, error: msg };
    }
  };

  // Subtask Management
  const createSubtask = async (todoId, title) => {
    try {
      await pb.collection("todo_subtasks").create({
        todo: todoId,
        title,
        done: false,
      });
      await fetchTodos();
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  };

  const toggleSubtask = async (subtaskId, currentDone) => {
    try {
      await pb.collection("todo_subtasks").update(subtaskId, { done: !currentDone });
      await fetchTodos();
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      await pb.collection("todo_subtasks").delete(subtaskId);
      await fetchTodos();
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  };

  return {
    todos,
    loading,
    error,
    refetch: fetchTodos,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    createSubtask,
    toggleSubtask,
    deleteSubtask,
  };
}