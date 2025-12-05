import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { useAuth } from '../context/AuthContext'; // Geändert
import { formatError } from '../lib/utils';

export function useShoppingList() {
  const { user } = useAuth(); // Geändert
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Sort: -status (damit 'open' oben steht), neueste zuerst
      const result = await pb.collection('shopping_items').getList(1, 200, { 
        sort: '-status,-created',
        filter: `owner = "${user.id}" || shared = true`,
        expand: 'fromRecipe'
      });
      setItems(result.items);
    } catch (err) {
      console.error(err);
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
      setItems((prev) => [record, ...prev]);
      return { success: true };
    } catch (err) {
      const msg = formatError(err);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'done' : 'open';
    // Optimistic Update
    setItems((prev) => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    
    try {
      await pb.collection('shopping_items').update(id, { status: newStatus });
      return { success: true };
    } catch (err) {
      // Rollback
      setItems((prev) => prev.map(item => item.id === id ? { ...item, status: currentStatus } : item));
      const msg = formatError(err);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const deleteItem = async (id) => {
    const prevItems = [...items];
    setItems((prev) => prev.filter(item => item.id !== id));
    
    try {
      await pb.collection('shopping_items').delete(id);
      return { success: true };
    } catch (err) {
      setItems(prevItems);
      const msg = formatError(err);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  return { 
    items, 
    loading, 
    error, 
    refetch: fetchItems, 
    createItem, 
    toggleStatus, 
    deleteItem 
  };
}