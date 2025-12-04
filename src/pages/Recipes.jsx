import React, { useState, useMemo } from 'react';
import { useRecipes } from '../hooks/useData';
import { POCKETBASE_URL } from '../lib/pocketbase';
import { Plus, X, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { FadeIn } from '../components/PageTransition';

export default function RecipesPage() {
  const { recipes, createRecipe, loading } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [tags, setTags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Alle verfügbaren Tags extrahieren
  const allTags = useMemo(() => {
    const tagSet = new Set();
    recipes.forEach(r => {
      if (r.tags) {
        r.tags.split(',').forEach(tag => tagSet.add(tag.trim()));
      }
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Gefilterte Rezepte
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || (r.tags && r.tags.split(',').map(t => t.trim()).includes(selectedTag));
      return matchesSearch && matchesTag;
    });
  }, [recipes, searchQuery, selectedTag]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('ingredients', ingredients);
    formData.append('steps', steps);
    formData.append('tags', tags);
    if (imageFile) formData.append('image', imageFile);
    await createRecipe(formData);
    setTitle(''); 
    setIngredients(''); 
    setSteps('');
    setTags('');
    setImageFile(null); 
    setShowForm(false);
  };

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Rezepte</h1>
            <p className="text-slate-500 text-sm">Eure gemeinsame Sammlung</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-brand-400 text-white p-2 rounded-full shadow-lg shadow-brand-200 hover:bg-brand-500 active:bg-brand-600 transition-colors"
          >
            {showForm ? <X size={24} /> : <Plus size={24} />}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-brand-100 space-y-4">
            <input 
              className="w-full font-semibold border-none focus:outline-none p-0 text-slate-800" 
              placeholder="Rezept Name" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <input 
              className="w-full text-sm border-none focus:outline-none p-0 text-slate-600" 
              placeholder="Tags (z.B. Gut, Besser, am Besten)" 
              value={tags} 
              onChange={e => setTags(e.target.value)} 
            />
            <textarea 
              className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[80px] focus:ring-2 focus:ring-brand-200 outline-none" 
              placeholder="Zutaten (eine Zeile pro Zutat)" 
              value={ingredients} 
              onChange={e => setIngredients(e.target.value)} 
            />
            <textarea 
              className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[80px] focus:ring-2 focus:ring-brand-200 outline-none" 
              placeholder="Zubereitungsschritte" 
              value={steps} 
              onChange={e => setSteps(e.target.value)} 
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                📷 {imageFile ? 'Bild da' : 'Bild?'}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => setImageFile(e.target.files[0])} 
                />
              </label>
              <button 
                type="submit" 
                className="ml-auto bg-brand-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500 active:bg-brand-600 transition-colors"
              >
                Speichern
              </button>
            </div>
          </form>
        )}

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rezept suchen..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-200 outline-none"
            />
          </div>
          
          {allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${!selectedTag ? 'bg-brand-400 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Alle
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${selectedTag === tag ? 'bg-brand-400 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <SkeletonLoader type="recipe" count={4} />
        ) : filteredRecipes.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">
            {searchQuery || selectedTag ? 'Keine Rezepte gefunden' : 'Noch keine Rezepte, geh kochen!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRecipes.map(r => (
              <Link 
                key={r.id} 
                to={`/recipes/${r.id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow block"
              >
                {r.image && <img src={`${POCKETBASE_URL}/api/files/${r.collectionId}/${r.id}/${r.image}`} alt={r.title} className="w-full h-32 object-cover" />}
                <div className="p-4">
                    <h3 className="font-bold text-slate-800 mb-2">{r.title}</h3>
                    {r.tags && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {r.tags.split(',').map((tag, i) => (
                          <span key={i} className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-3">{r.ingredients}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}