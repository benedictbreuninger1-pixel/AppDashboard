import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { useAuthStore } from '../lib/store';

export function useShoppingList() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const records = await pb.collection('shopping_items').getFullList({ 
        sort: 'status,-created',
        expand: 'fromRecipe'
      });
      setItems(records);
    } catch (e) {
      console.error("Fehler beim Laden der Einkaufsliste:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const createItem = async (name, amount, isShared, fromRecipeId = null) => {
    const data = {
      name,
      amount: amount || '',
      status: 'open',
      shared: isShared,
      owner: user.id,
    };
    if (fromRecipeId) data.fromRecipe = fromRecipeId;
    
    try {
      const record = await pb.collection('shopping_items').create(data);
      setItems([record, ...items]);
    } catch (err) {
      console.error("Fehler beim Erstellen:", err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'bought' : 'open';
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    await pb.collection('shopping_items').update(id, { status: newStatus });
  };

  const deleteItem = async (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    await pb.collection('shopping_items').delete(id);
  };

  return { items, loading, createItem, toggleStatus, deleteItem };
}