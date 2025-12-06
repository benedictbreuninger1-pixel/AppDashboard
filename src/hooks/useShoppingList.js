import { useState, useEffect, useCallback } from "react";
import { pb } from "../lib/pocketbase";
import { useAuth } from "../context/AuthContext";
import { formatError, categorizeItem } from "../lib/utils";

export function useShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await pb.collection("shopping_items").getList(1, 200, {
        sort: "-status,-created",
        filter: `owner = "${user.id}" || shared = true`,
        expand: "fromRecipe",
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
    // Auto-Kategorisierung beim Erstellen
    const autoCategory = categorizeItem(name);
    
    const data = {
      name,
      amount: amount || "",
      status: "open",
      shared: isShared,
      owner: user.id,
      category: autoCategory || "", // Automatisch gesetzt oder leer
    };
    if (fromRecipeId) data.fromRecipe = fromRecipeId;

    try {
      const record = await pb.collection("shopping_items").create(data);
      setItems((prev) => [record, ...prev]);
      return { success: true };
    } catch (err) {
      const msg = formatError(err);
      return { success: false, error: msg };
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "open" ? "done" : "open";

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );

    try {
      await pb.collection("shopping_items").update(id, { status: newStatus });
      return { success: true };
    } catch (err) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: currentStatus } : item
        )
      );
      const msg = formatError(err);
      return { success: false, error: msg };
    }
  };

  const deleteItem = async (id) => {
    const prevItems = [...items];
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await pb.collection("shopping_items").delete(id);
      return { success: true };
    } catch (err) {
      setItems(prevItems);
      const msg = formatError(err);
      return { success: false, error: msg };
    }
  };

  const bulkDeleteDone = async () => {
    const doneItems = items.filter(item => item.status === 'done');
    const doneIds = doneItems.map(item => item.id);
    
    if (doneIds.length === 0) {
      return { success: false, error: 'Keine erledigten Items' };
    }

    // Optimistic update
    setItems(prev => prev.filter(item => item.status !== 'done'));

    try {
      await Promise.all(
        doneIds.map(id => pb.collection("shopping_items").delete(id))
      );
      return { success: true, count: doneIds.length };
    } catch (err) {
      await fetchItems(); // Rollback
      const msg = formatError(err);
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
    deleteItem,
    bulkDeleteDone,
  };
}