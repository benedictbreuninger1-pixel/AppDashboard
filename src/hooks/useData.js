import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { useAuthStore } from '../lib/store';

// --- TODOS HOOK ---
export function useTodos() {
  const user = useAuthStore((state) => state.user);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    try {
      const records = await pb.collection('todos').getFullList({ sort: '-created' });
      setTodos(records);
    } catch (e) {
      console.error("Fehler beim Laden:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTodos();
  }, [user]);

  const createTodo = async (title, isShared) => {
    const data = {
      title,
      status: 'open',
      shared: isShared,
      owner: user.id,
    };
    try {
        const record = await pb.collection('todos').create(data);
        setTodos([record, ...todos]);
    } catch (err) {
        console.error("Fehler beim Erstellen:", err);
    }
  };

  const toggleTodo = async (id, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'done' : 'open';
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await pb.collection('todos').update(id, { status: newStatus });
  };

  const deleteTodo = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await pb.collection('todos').delete(id);
  };

  return { todos, loading, createTodo, toggleTodo, deleteTodo };
}

// --- REZEPTE HOOK ---
export function useRecipes() {
  const user = useAuthStore((state) => state.user);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    try {
      const records = await pb.collection('recipes').getFullList({ sort: '-created' });
      setRecipes(records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRecipes();
  }, [user]);


  const createRecipe = async (formData) => {
    if (!formData.has('owner')) formData.append('owner', user.id);
    const record = await pb.collection('recipes').create(formData);
    setRecipes([record, ...recipes]);
  };

  const updateRecipe = async (id, formData) => {
    const record = await pb.collection('recipes').update(id, formData);
    setRecipes(prev => prev.map(r => r.id === id ? record : r));
    return record;
  };

  const deleteRecipe = async (id) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    await pb.collection('recipes').delete(id);
  };

  return { recipes, loading, createRecipe, updateRecipe, deleteRecipe };                                     
}