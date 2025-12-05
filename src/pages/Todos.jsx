import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos'; // NEU
import { Plus, Trash2, Users, Lock, CheckSquare, AlertCircle } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { FadeIn } from '../components/PageTransition';

export default function TodosPage() {
  const { todos, createTodo, toggleTodo, deleteTodo, loading, error } = useTodos(); // NEU: error destructuring
  const [text, setText] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleSubmit = async (e) => { // Async für Feedback
    e.preventDefault();
    if (!text.trim()) return;
    
    const res = await createTodo(text, isShared);
    
    if (res.success) {
        setText('');
        setIsShared(false);
        // Hier könnte später stehen: toast.success("Todo erstellt");
    } else {
        // Hier könnte später stehen: toast.error(res.error);
        console.error("Fehler:", res.error); 
    }
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'shared') return t.shared;
    if (filter === 'private') return !t.shared;
    return true;
  });

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Error Banner falls globaler Hook Fehler */}
        {error && (
             <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                 <AlertCircle size={16} /> {error}
             </div>
        )}

        {/* ... Rest der UI (Header, Form) bleibt gleich ... */}
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Aufgaben</h1>
            <p className="text-slate-500 text-sm">Produktiv tun. Aufgabe eintragen.</p>
          </div>
          
          <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
            {['all', 'private', 'shared'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-white shadow-sm text-brand-500' : 'text-slate-500'}`}
              >
                {f === 'all' ? 'Alle' : f === 'private' ? 'Ich' : 'Wir'}
              </button>
            ))}
          </div>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 focus-within:ring-2 ring-brand-200">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Neue Aufgabe..." 
              className="flex-1 bg-transparent border-none focus:outline-none placeholder:text-slate-400" 
            />
            <button 
              type="submit" 
              disabled={!text} 
              className="bg-brand-400 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-brand-500 active:bg-brand-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="mt-2">
            <label className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${isShared ? 'bg-brand-100 text-brand-600' : 'bg-slate-50 text-slate-500'}`}>
              <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="hidden" />
              {isShared ? <Users size={12} /> : <Lock size={12} />}
              {isShared ? 'Für beide' : 'Nur für mich'}
            </label>
          </div>
        </form>

        {loading ? (
          <SkeletonLoader type="todo" count={4} />
        ) : filteredTodos.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">Alles erledigt! 🎉</p>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map(todo => (
              <div key={todo.id} className="group flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <button 
                  onClick={() => toggleTodo(todo.id, todo.status)} 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.status === 'done' ? 'bg-brand-400 border-brand-400' : 'border-slate-300'}`}
                >
                  {todo.status === 'done' && <CheckSquare size={14} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`truncate ${todo.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{todo.title}</p>
                  {todo.shared && <span className="text-[10px] text-brand-500 flex items-center gap-1"><Users size={10}/> Gemeinsam</span>}
                </div>
                <button 
                  onClick={() => deleteTodo(todo.id)} 
                  className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}