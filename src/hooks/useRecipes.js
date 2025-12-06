import { useState, useEffect, useCallback } from "react";
import { pb } from "../lib/pocketbase";
import { useAuth } from "../context/AuthContext";
import { formatError } from "../lib/utils";

export function useRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await pb.collection("recipes").getList(1, 200, {
        sort: "-created",
        expand: "recipe_ingredients_via_recipe",
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
      await fetchRecipes(); // Reload mit expand
      return { success: true, data: record };
    } catch (err) {
      const msg = formatError(err);
      return { success: false, error: msg };
    }
  };

  const updateRecipe = async (id, formData) => {
    try {
      const record = await pb.collection("recipes").update(id, formData);
      await fetchRecipes();
      return { success: true, data: record };
    } catch (err) {
      const msg = formatError(err);
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

  // Structured Ingredients Management
  const createIngredient = async (recipeId, data) => {
    try {
      await pb.collection("recipe_ingredients").create({
        recipe: recipeId,
        name: data.name,
        amount: data.amount || "",
        unit: data.unit || "",
      });
      await fetchRecipes();
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  };

  const updateIngredient = async (ingredientId, data) => {
    try {
      await pb.collection("recipe_ingredients").update(ingredientId, data);
      await fetchRecipes();
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  };

  const deleteIngredient = async (ingredientId) => {
    try {
      await pb.collection("recipe_ingredients").delete(ingredientId);
      await fetchRecipes();
      return { success: true };
    } catch (err) {
      return { success: false, error: formatError(err) };
    }
  };

  const bulkCreateIngredients = async (recipeId, ingredients) => {
    try {
      await Promise.all(
        ingredients.map(ing =>
          pb.collection("recipe_ingredients").create({
            recipe: recipeId,
            name: ing.name,
            amount: ing.amount || "",
            unit: ing.unit || "",
          })
        )
      );
      await fetchRecipes();
      return { success: true };
    } catch (err) {
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
    createIngredient,
    updateIngredient,
    deleteIngredient,
    bulkCreateIngredients,
  };
}