import React, { useState, useMemo } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { POCKETBASE_URL } from '../lib/pocketbase';
import { Plus, X, Search, Heart, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { FadeIn } from '../components/PageTransition';

export default function RecipesPage() {
  const { recipes, createRecipe, toggleFavorite, loading, error } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [tags, setTags] = useState('');
  const [mainImageFile, setMainImageFile] = useState(null);
  const [extraImagesFiles, setExtraImagesFiles] = useState([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Alle Tags sammeln
  const allTags = useMemo(() => {
    const tagSet = new Set();
    recipes.forEach(r => {
      if (r.tags) {
        r.tags.split(',').forEach(tag => tagSet.add(tag.trim()));
      }
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Filtern
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (r.ingredients && r.ingredients.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || (r.tags && r.tags.split(',').map(t => t.trim()).includes(selectedTag));
      const matchesFavorite = !showFavoritesOnly || r.isFavorite;
      return matchesSearch && matchesTag && matchesFavorite;
    });
  }, [recipes, searchQuery, selectedTag, showFavoritesOnly]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('ingredients', ingredients);
    formData.append('steps', steps);
    formData.append('tags', tags);
    if (mainImageFile) formData.append('mainImage', mainImageFile);
    extraImagesFiles.forEach(file => formData.append('extraImages', file));
    
    const res = await createRecipe(formData);
    
    if (res.success) {
        setTitle(''); 
        setDescription('');
        setIngredients(''); 
        setSteps('');
        setTags('');
        setMainImageFile(null);
        setExtraImagesFiles([]);
        setShowForm(false);
    } else {
        alert("Fehler beim Erstellen: " + res.error);
    }
  };

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Error Anzeige */}
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-4">
                <AlertCircle size={16} /> {error}
            </div>
        )}

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

        {/* Create Form */}
        {showForm && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-brand-100 space-y-4">
                 <input className="w-full font-semibold border-none focus:outline-none p-0 text-slate-800" placeholder="Rezept Name" value={title} onChange={e => setTitle(e.target.value)} required />
                 <textarea className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[60px] focus:ring-2 focus:ring-brand-200 outline-none" placeholder="Kurze Beschreibung" value={description} onChange={e => setDescription(e.target.value)} />
                 <input className="w-full text-sm border-none focus:outline-none p-0 text-slate-600" placeholder="Tags (z.B. Vegan, Schnell)" value={tags} onChange={e => setTags(e.target.value)} />
                 <textarea className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[80px] focus:ring-2 focus:ring-brand-200 outline-none" placeholder="Zutaten" value={ingredients} onChange={e => setIngredients(e.target.value)} />
                 <textarea className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[80px] focus:ring-2 focus:ring-brand-200 outline-none" placeholder="Zubereitungsschritte" value={steps} onChange={e => setSteps(e.target.value)} />
                 
                 {/* Image Uploads */}
                 <div className="space-y-2">
                   <label className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                     📷 {mainImageFile ? 'Hauptbild gewählt' : 'Hauptbild (optional)'}
                     <input type="file" accept="image/*" className="hidden" onChange={e => setMainImageFile(e.target.files[0])} />
                   </label>
                   
                   <label className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                     🖼️ {extraImagesFiles.length > 0 ? `${extraImagesFiles.length} Zusatzbilder` : 'Zusatzbilder (max 3)'}
                     <input type="file" accept="image/*" multiple className="hidden" onChange={e => setExtraImagesFiles(Array.from(e.target.files).slice(0, 3))} />
                   </label>
                 </div>

                 <div className="flex gap-2 pt-2">
                    <button type="button" onClick={handleSubmit} className="flex-1 bg-brand-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500">Speichern</button>
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Abbrechen</button>
                 </div>
            </div>
        )}
        
        {/* Search & Filter UI (HIER WERDEN DIE VARIABLEN BENUTZT) */}
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
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-colors ${showFavoritesOnly ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Heart size={12} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              Favoriten
            </button>
            
            {allTags.length > 0 && (
              <>
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${!selectedTag ? 'bg-brand-400 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Alle Tags
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
              </>
            )}
          </div>
        </div>

        {loading ? (
          <SkeletonLoader type="recipe" count={4} />
        ) : filteredRecipes.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">
            {searchQuery || selectedTag ? 'Keine Rezepte gefunden' : 'Noch keine Rezepte'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRecipes.map(r => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative">
                <Link to={`/recipes/${r.id}`} className="block">
                  {r.mainImage && <img src={`${POCKETBASE_URL}/api/files/${r.collectionId}/${r.id}/${r.mainImage}`} alt={r.title} className="w-full h-32 object-cover" />}
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
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(r.id, r.isFavorite);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                >
                  <Heart size={18} className={r.isFavorite ? 'text-pink-500' : 'text-slate-400'} fill={r.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}