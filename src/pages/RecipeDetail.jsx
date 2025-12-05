import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Save, X, ShoppingCart, Heart } from 'lucide-react';
import { pb, POCKETBASE_URL } from '../lib/pocketbase';
import { useRecipes } from '../hooks/useRecipes';
import { useShoppingList } from '../hooks/useShoppingList';
import { FadeIn } from '../components/PageTransition';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateRecipe, deleteRecipe, toggleFavorite } = useRecipes();
  const { createItem } = useShoppingList();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  
  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIngredients, setEditIngredients] = useState('');
  const [editSteps, setEditSteps] = useState('');
  const [editTags, setEditTags] = useState('');
  const [newMainImage, setNewMainImage] = useState(null);
  const [newExtraImages, setNewExtraImages] = useState([]);
  
  // Ingredients Selection
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const record = await pb.collection('recipes').getOne(id);
        setRecipe(record);
        setEditTitle(record.title);
        setEditDescription(record.description || '');
        setEditIngredients(record.ingredients || '');
        setEditSteps(record.steps || '');
        setEditTags(record.tags || '');
      } catch (err) {
        console.error('Rezept laden fehlgeschlagen:', err);
        navigate('/recipes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipe();
  }, [id, navigate]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDescription);
    formData.append('ingredients', editIngredients);
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
    } else {
        alert("Fehler beim Speichern: " + res.error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Rezept wirklich löschen?')) {
      const res = await deleteRecipe(id);
      if (res.success) {
          navigate('/recipes');
      } else {
          alert("Konnte nicht gelöscht werden: " + res.error);
      }
    }
  };
  
  const handleToggleFavorite = async () => {
    await toggleFavorite(id, recipe.isFavorite);
    setRecipe(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
  };

  // --- DIE FEHLENDE FUNKTION ---
  const handleAddToShoppingList = () => {
    if (!recipe.ingredients) return;
    const lines = recipe.ingredients.split('\n').filter(l => l.trim());
    // Standardmäßig alle auswählen
    setSelectedIngredients(lines.map((_, i) => i));
    setShowIngredientsModal(true);
  };
  
  const handleConfirmIngredients = async () => {
    const lines = recipe.ingredients.split('\n').filter(l => l.trim());
    for (const idx of selectedIngredients) {
      await createItem(lines[idx], '', false, id);
    }
    setShowIngredientsModal(false);
    setSelectedIngredients([]);
  };
  
  const toggleIngredient = (idx) => {
    setSelectedIngredients(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-48 bg-slate-200 rounded" />
          <div className="h-20 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link 
            to="/recipes" 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Zurück</span>
          </Link>
          
          {!isEditing && (
            <div className="flex gap-2">
              <button 
                onClick={handleToggleFavorite}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-pink-50 rounded-lg transition-colors"
              >
                <Heart 
                  size={16} 
                  className={recipe.isFavorite ? 'text-pink-500' : 'text-slate-400'}
                  fill={recipe.isFavorite ? 'currentColor' : 'none'}
                />
              </button>
              <button 
                onClick={handleAddToShoppingList}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ShoppingCart size={16} /> Einkaufen
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                <Edit2 size={16} /> Bearbeiten
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} /> Löschen
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          // EDIT MODE
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 space-y-4">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold border-none focus:outline-none text-slate-800"
              placeholder="Rezept Name"
            />
            
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[60px] focus:ring-2 focus:ring-brand-200 outline-none"
              placeholder="Kurze Beschreibung (optional)"
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <input
                type="text"
                value={editTags}
                onChange={e => setEditTags(e.target.value)}
                className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="Vegan, Schnell, Dessert"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Zutaten</label>
              <textarea
                value={editIngredients}
                onChange={e => setEditIngredients(e.target.value)}
                className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[100px] focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="Zutaten (eine Zeile pro Zutat oder Freitext)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Zubereitung</label>
              <textarea
                value={editSteps}
                onChange={e => setEditSteps(e.target.value)}
                className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[150px] focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="Zubereitungsschritte"
              />
            </div>
            
            {/* Image Uploads */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                📷 {newMainImage ? 'Neues Hauptbild gewählt' : 'Hauptbild ändern (optional)'}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => setNewMainImage(e.target.files[0])} 
                />
              </label>
              
              <label className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                🖼️ {newExtraImages.length > 0 ? `${newExtraImages.length} neue Zusatzbilder` : 'Zusatzbilder ändern (max 3)'}
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  onChange={e => setNewExtraImages(Array.from(e.target.files).slice(0, 3))} 
                />
              </label>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-brand-400 text-white rounded-lg hover:bg-brand-500 transition-colors"
              >
                <Save size={16} /> Speichern
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewMainImage(null);
                  setNewExtraImages([]);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <X size={16} /> Abbrechen
              </button>
            </div>
          </div>
        ) : (
          // VIEW MODE
          <div className="space-y-6">
            {/* Main Image */}
            {recipe.mainImage && (
              <div className="rounded-2xl overflow-hidden shadow-sm">
                <img 
                  src={`${POCKETBASE_URL}/api/files/${recipe.collectionId}/${recipe.id}/${recipe.mainImage}`} 
                  alt={recipe.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}
            
            {/* Extra Images Gallery */}
            {recipe.extraImages && recipe.extraImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {recipe.extraImages.map((img, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden shadow-sm aspect-square">
                    <img 
                      src={`${POCKETBASE_URL}/api/files/${recipe.collectionId}/${recipe.id}/${img}`} 
                      alt={`${recipe.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-slate-600">{recipe.description}</p>
              )}
              {recipe.tags && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {recipe.tags.split(',').map((tag, i) => (
                    <span key={i} className="text-xs bg-brand-100 text-brand-600 px-3 py-1 rounded-full">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Ingredients */}
            {recipe.ingredients && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Zutaten</h2>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {recipe.ingredients}
                </div>
              </div>
            )}
            
            {/* Steps */}
            {recipe.steps && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Zubereitung</h2>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {recipe.steps}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Ingredients Modal */}
        {showIngredientsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowIngredientsModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Zur Einkaufsliste hinzufügen</h2>
              
              <div className="space-y-2 mb-6">
                {recipe.ingredients.split('\n').filter(l => l.trim()).map((line, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.includes(idx)}
                      onChange={() => toggleIngredient(idx)}
                      className="w-5 h-5 text-brand-500 rounded focus:ring-brand-400"
                    />
                    <span className="text-sm text-slate-700">{line}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmIngredients}
                  disabled={selectedIngredients.length === 0}
                  className="flex-1 bg-brand-400 text-white py-2 rounded-lg hover:bg-brand-500 disabled:opacity-50 transition-colors"
                >
                  Hinzufügen ({selectedIngredients.length})
                </button>
                <button
                  onClick={() => setShowIngredientsModal(false)}
                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}