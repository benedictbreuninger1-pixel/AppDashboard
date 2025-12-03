import React, { useState } from 'react';
import { useRecipes } from '../hooks/useData';
import { POCKETBASE_URL } from '../lib/pocketbase';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';

export default function RecipesPage() {
  const { recipes, createRecipe, deleteRecipe, loading } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('ingredients', ingredients);
    formData.append('steps', steps);
    if (imageFile) formData.append('image', imageFile);
    await createRecipe(formData);
    setTitle(''); setIngredients(''); setSteps(''); setImageFile(null); setShowForm(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Rezepte</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-rose-500 text-white p-2 rounded-full shadow-lg shadow-rose-200">
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 space-y-4">
          <input className="w-full font-semibold border-none focus:outline-none p-0" placeholder="Rezept Name" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[80px]" placeholder="Zutaten..." value={ingredients} onChange={e => setIngredients(e.target.value)} />
          <textarea className="w-full text-sm bg-slate-50 rounded-lg p-3 border-none min-h-[80px]" placeholder="Zubereitung..." value={steps} onChange={e => setSteps(e.target.value)} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg cursor-pointer">
              <ImageIcon size={16} /> {imageFile ? 'Bild da' : 'Bild?'}
              <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
            </label>
            <button type="submit" className="ml-auto bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Speichern</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? <p className="text-slate-400">Lade...</p> : recipes.map(r => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {r.image && <img src={`${POCKETBASE_URL}/api/files/${r.collectionId}/${r.id}/${r.image}`} alt={r.title} className="w-full h-32 object-cover" />}
            <div className="p-4 relative">
                <h3 className="font-bold text-slate-800 mb-2">{r.title}</h3>
                <button onClick={() => deleteRecipe(r.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                <p className="text-xs text-slate-500 line-clamp-3">{r.ingredients}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}