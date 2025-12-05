import { useState, useEffect, useCallback } from "react";
import { pb } from "../lib/pocketbase";
import { useAuth } from "../context/AuthContext"; // Geändert
import { formatError } from "../lib/utils";

export function useRecipes() {
  const { user } = useAuth(); // Geändert
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Lade die neuesten 200 Rezepte
      const result = await pb.collection("recipes").getList(1, 200, {
        sort: "-created",
        // Optional: Expliziter Filter, falls API-Rules nicht reichen
        // filter: `owner = "${user.id}" || shared = true`
      });
      setRecipes(result.items);
    } catch (err) {
      console.error(err);
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const createRecipe = async (formData) => {
    if (!formData.has("owner")) formData.append("owner", user.id);
    try {
      const record = await pb.collection("recipes").create(formData);
      setRecipes((prev) => [record, ...prev]);
      return { success: true, data: record };
    } catch (err) {
      const msg = formatError(err);
      // ❌ setError(msg);
      return { success: false, error: msg };
    }
  };

  const updateRecipe = async (id, formData) => {
    try {
      const record = await pb.collection("recipes").update(id, formData);
      setRecipes((prev) => prev.map((r) => (r.id === id ? record : r)));
      return { success: true, data: record };
    } catch (err) {
      const msg = formatError(err);
      // ❌ setError(msg);
      return { success: false, error: msg };
    }
  };

  const deleteRecipe = async (id) => {
    const prevRecipes = [...recipes];
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    try {
      await pb.collection("recipes").delete(id);
      return { success: true };
    } catch (err) {
      setRecipes(prevRecipes);
      const msg = formatError(err);
      // ❌ setError(msg);
      return { success: false, error: msg };
    }
  };

  const toggleFavorite = async (id, currentStatus) => {
    try {
      const record = await pb
        .collection("recipes")
        .update(id, { isFavorite: !currentStatus });
      setRecipes((prev) => prev.map((r) => (r.id === id ? record : r)));
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: formatError(err) };
    }
  };

  return {
    recipes,
    loading,
    error,
    refetch: fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
  };
}
