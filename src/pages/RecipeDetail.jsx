import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Save, X, ShoppingCart, Heart, Plus } from 'lucide-react';
import { pb, POCKETBASE_URL } from '../lib/pocketbase';
import { useRecipes } from '../hooks/useRecipes';
import { useShoppingList } from '../hooks/useShoppingList';
import { useToast } from '../context/ToastContext';
import { FadeIn } from '../components/PageTransition';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateRecipe, deleteRecipe, toggleFavorite, createIngredient, deleteIngredient } = useRecipes();
  const { createItem } = useShoppingList();
  const { showToast } = useToast();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSteps, setEditSteps] = useState('');
  const [editTags, setEditTags] = useState('');
  const [newMainImage, setNewMainImage] = useState(null);
  const [newExtraImages, setNewExtraImages] = useState([]);
  
  // Structured Ingredients Editing
  const [editIngredients, setEditIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState({ name: '', amount: '', unit: '' });
  
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const record = await pb.collection('recipes').getOne(id, {
          expand: 'recipe_ingredients_via_recipe'
        });
        setRecipe(record);
        setEditTitle(record.title);
        setEditDescription(record.description || '');
        setEditSteps(record.steps || '');
        setEditTags(record.tags || '');
        
        // Load structured ingredients
        if (record.expand?.recipe_ingredients_via_recipe) {
          setEditIngredients(record.expand.recipe_ingredients_via_recipe);
        }
      } catch (err) {
        console.error(err);
        showToast('Rezept konnte nicht geladen werden', 'error');
        navigate('/recipes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipe();
  }, [id, navigate, showToast]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDescription);
    formData.append('steps', editSteps);
    formData.append('tags', editTags);
    if (newMainImage) formData.append('mainImage', newMainImage);
    newExtraImages.forEach(file => formData.append('extraImages', file));
    
    const res = await updateRecipe(id, formData);
    if (res.success) {
        setRecipe(res.data);
        setNewMainImage(null);
        setNewExtraImages([]);
        setIsEditing(false);
        showToast('Rezept gespeichert', 'success');
        
        // Reload to get updated ingredients
        const updated = await pb.collection('recipes').getOne(id, {
          expand: 'recipe_ingredients_via_recipe'
        });
        setRecipe(updated);
        if (updated.expand?.recipe_ingredients_via_recipe) {
          setEditIngredients(updated.expand.recipe_ingredients_via_recipe);
        }
    } else {
        showToast(res.error, 'error');
    }
  };

  const handleDelete = async () => {
    const res = await deleteRecipe(id);
    if (res.success) {
        showToast('Rezept gelöscht', 'info');
        navigate('/recipes');
    } else {
        showToast(res.error, 'error');
    }
  };
  
  const handleToggleFavorite = async () => {
    await toggleFavorite(id, recipe.isFavorite);
    setRecipe(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) return;
    
    const res = await createIngredient(id, newIngredient);
    if (res.success) {
      const updated = await pb.collection('recipes').getOne(id, {
        expand: 'recipe_ingredients_via_recipe'
      });
      setRecipe(updated);
      if (updated.expand?.recipe_ingredients_via_recipe) {
        setEditIngredients(updated.expand.recipe_ingredients_via_recipe);
      }
      setNewIngredient({ name: '', amount: '', unit: '' });
      showToast('Zutat hinzugefügt', 'success');
    } else {
      showToast(res.error, 'error');
    }
  };

  const handleDeleteIngredient = async (ingredientId) => {
    const res = await deleteIngredient(ingredientId);
    if (res.success) {
      setEditIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
      showToast('Zutat gelöscht', 'info');
    } else {
      showToast(res.error, 'error');
    }
  };

  const handleAddToShoppingList = () => {
    const hasStructured = recipe.expand?.recipe_ingredients_via_recipe?.length > 0;
    
    if (hasStructured) {
      const ingredients = recipe.expand.recipe_ingredients_via_recipe;
      setSelectedIngredients(ingredients.map((_, i) => i));
      setShowIngredientsModal(true);
    } else if (recipe.ingredients) {
      // Legacy fallback
      const lines = recipe.ingredients.split('\n').filter(l => l.trim());
      setSelectedIngredients(lines.map((_, i) => i));
      setShowIngredientsModal(true);
    }
  };
  
  const handleConfirmIngredients = async () => {
    const hasStructured = recipe.expand?.recipe_ingredients_via_recipe?.length > 0;
    
    if (hasStructured) {
      const ingredients = recipe.expand.recipe_ingredients_via_recipe;
      for (const idx of selectedIngredients) {
        const ing = ingredients[idx];
        const displayName = `${ing.amount} ${ing.unit} ${ing.name}`.trim();
        await createItem(displayName, '', false, id);
      }
    } else {
      const lines = recipe.ingredients.split('\n').filter(l => l.trim());
      for (const idx of selectedIngredients) {
        await createItem(lines[idx], '', false, id);
      }
    }
    
    setShowIngredientsModal(false);
    setSelectedIngredients([]);
    showToast(`${selectedIngredients.length} Zutaten hinzugefügt`, 'success');
  };
  
  const toggleIngredient = (idx) => {
    setSelectedIngredients(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 dark:text-slate-400">Lädt...</div>;
  }

  if (!recipe) return null;

  const hasStructuredIngredients = recipe.expand?.recipe_ingredients_via_recipe?.length > 0;

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <Link to="/recipes" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <ArrowLeft size={20} /> <span className="text-sm">Zurück</span>
          </Link>
          
          {!isEditing && (
            <div className="flex gap-2">
              <button onClick={handleToggleFavorite} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors">
                <Heart size={16} className={recipe.isFavorite ? 'text-pink-500' : 'text-slate-400 dark:text-slate-500'} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button onClick={handleAddToShoppingList} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ShoppingCart size={16} /> Einkaufen
              </button>
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors">
                <Edit2 size={16} /> Bearbeiten
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={16} /> Löschen
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-900/30 space-y-4">
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-2xl font-bold border-none focus:outline-none text-slate-800 dark:text-slate-100 dark:bg-slate-900" placeholder="Rezept Name" />
            <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border-none min-h-[60px] focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:text-slate-200" placeholder="Beschreibung" />
            <input type="text" value={editTags} onChange={e => setEditTags(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:text-slate-200" placeholder="Tags" />
            
            {/* Structured Ingredients Editor */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Zutaten</label>
              {editIngredients.map(ing => (
                <div key={ing.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">
                    {ing.amount} {ing.unit} {ing.name}
                  </span>
                  <button onClick={() => handleDeleteIngredient(ing.id)} className="text-red-500 hover:text-red-700">
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Menge"
                  value={newIngredient.amount}
                  onChange={e => setNewIngredient({...newIngredient, amount: e.target.value})}
                  className="w-20 px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Einheit"
                  value={newIngredient.unit}
                  onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})}
                  className="w-20 px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Zutat"
                  value={newIngredient.name}
                  onChange={e => setNewIngredient({...newIngredient, name: e.target.value})}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:text-slate-200"
                />
                <button onClick={handleAddIngredient} className="px-3 py-2 bg-brand-400 text-white rounded-lg hover:bg-brand-500">
                  <Plus size={14} />
                </button>
              </div>
            </div>
            
            <textarea value={editSteps} onChange={e => setEditSteps(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border-none min-h-[150px] focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:text-slate-200" placeholder="Zubereitung" />
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
                📷 {newMainImage ? 'Neues Hauptbild' : 'Hauptbild ändern'}
                <input type="file" accept="image/*" className="hidden" onChange={e => setNewMainImage(e.target.files[0])} />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
                🖼️ {newExtraImages.length > 0 ? `${newExtraImages.length} neue Zusatzbilder` : 'Zusatzbilder ändern'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => setNewExtraImages(Array.from(e.target.files).slice(0, 3))} />
              </label>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-brand-400 text-white rounded-lg hover:bg-brand-500"><Save size={16} /> Speichern</button>
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"><X size={16} /> Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {recipe.mainImage && <div className="rounded-2xl overflow-hidden shadow-sm"><img src={`${POCKETBASE_URL}/api/files/${recipe.collectionId}/${recipe.id}/${recipe.mainImage}`} alt={recipe.title} className="w-full h-64 object-cover" /></div>}
            {recipe.extraImages && recipe.extraImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {recipe.extraImages.map((img, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden shadow-sm aspect-square"><img src={`${POCKETBASE_URL}/api/files/${recipe.collectionId}/${recipe.id}/${img}`} alt="Extra" className="w-full h-full object-cover" /></div>
                ))}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{recipe.title}</h1>
              {recipe.description && <p className="text-slate-600 dark:text-slate-400">{recipe.description}</p>}
              {recipe.tags && <div className="flex gap-2 flex-wrap mt-3">{recipe.tags.split(',').map((tag, i) => <span key={i} className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 px-3 py-1 rounded-full">{tag.trim()}</span>)}</div>}
            </div>
            
            {/* Ingredients Display */}
            {(hasStructuredIngredients || recipe.ingredients) && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Zutaten</h2>
                {hasStructuredIngredients ? (
                  <ul className="space-y-2">
                    {recipe.expand.recipe_ingredients_via_recipe.map((ing, idx) => (
                      <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                        <span className="text-slate-400">•</span>
                        <span className="flex-1">
                          {ing.amount && <span className="font-medium">{ing.amount}</span>}
                          {ing.unit && <span className="text-slate-500 dark:text-slate-400"> {ing.unit}</span>}
                          {' '}{ing.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{recipe.ingredients}</div>
                )}
              </div>
            )}
            
            {recipe.steps && <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"><h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Zubereitung</h2><div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{recipe.steps}</div></div>}
          </div>
        )}
        
        {/* Ingredients Modal */}
        {showIngredientsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowIngredientsModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Zur Einkaufsliste</h2>
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {hasStructuredIngredients ? (
                  recipe.expand.recipe_ingredients_via_recipe.map((ing, idx) => (
                    <label key={idx} className="flex gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                      <input type="checkbox" checked={selectedIngredients.includes(idx)} onChange={() => toggleIngredient(idx)} className="w-5 h-5 text-brand-500 rounded" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {ing.amount} {ing.unit} {ing.name}
                      </span>
                    </label>
                  ))
                ) : (
                  recipe.ingredients.split('\n').filter(l => l.trim()).map((line, idx) => (
                    <label key={idx} className="flex gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                      <input type="checkbox" checked={selectedIngredients.includes(idx)} onChange={() => toggleIngredient(idx)} className="w-5 h-5 text-brand-500 rounded" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{line}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleConfirmIngredients} disabled={selectedIngredients.length === 0} className="flex-1 bg-brand-400 text-white py-2 rounded-lg hover:bg-brand-500 disabled:opacity-50">Hinzufügen</button>
                <button onClick={() => setShowIngredientsModal(false)} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700">Abbrechen</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Rezept löschen?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Möchtest du dieses Rezept wirklich unwiderruflich löschen?</p>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}