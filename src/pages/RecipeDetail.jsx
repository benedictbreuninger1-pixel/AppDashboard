import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Save, X } from 'lucide-react';
import { pb, POCKETBASE_URL } from '../lib/pocketbase';
import { useRecipes } from '../hooks/useData';
import { FadeIn } from '../components/PageTransition';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateRecipe, deleteRecipe } = useRecipes();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIngredients, setEditIngredients] = useState('');
  const [editSteps, setEditSteps] = useState('');

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const record = await pb.collection('recipes').getOne(id);
        setRecipe(record);
        setEditTitle(record.title);
        setEditDescription(record.description || '');
        setEditIngredients(record.ingredients || '');
        setEditSteps(record.steps || '');
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
    
    const updated = await updateRecipe(id, formData);
    setRecipe(updated);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Rezept wirklich löschen?')) {
      await deleteRecipe(id);
      navigate('/recipes');
    }
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
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-brand-400 text-white rounded-lg hover:bg-brand-500 transition-colors"
              >
                <Save size={16} /> Speichern
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <X size={16} /> Abbrechen
              </button>
            </div>
          </div>
        ) : (
          // VIEW MODE
          <div className="space-y-6">
            {/* Image */}
            {recipe.image && (
              <div className="rounded-2xl overflow-hidden shadow-sm">
                <img 
                  src={`${POCKETBASE_URL}/api/files/${recipe.collectionId}/${recipe.id}/${recipe.image}`} 
                  alt={recipe.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}
            
            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-slate-600">{recipe.description}</p>
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
      </div>
    </FadeIn>
  );
}