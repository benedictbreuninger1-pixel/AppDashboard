import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos';
import { useToast } from '../context/ToastContext';
import { Plus, Users, Lock, CheckSquare, Trash2 } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { FadeIn } from '../components/PageTransition';
import PullToRefresh from '../components/PullToRefresh';
import ErrorBanner from '../components/ErrorBanner';
import SwipeableListItem from '../components/SwipeableListItem';

export default function TodosPage() {
  const { todos, createTodo, toggleTodo, deleteTodo, refetch, loading, error } = useTodos();
  const { showToast } = useToast();
  
  const [text, setText] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const res = await createTodo(text, isShared);
    
    if (res.success) {
        setText('');
        setIsShared(false);
        showToast('Aufgabe hinzugefügt!', 'success');
    } else {
        showToast(res.error, 'error');
    }
  };

  const handleToggle = async (id, status) => {
     const res = await toggleTodo(id, status);
     if (!res.success) showToast(res.error, 'error');
  };

  const handleDelete = async (id) => {
     // Finde Todo für Undo
     const todoToDelete = todos.find(t => t.id === id);
     
     const res = await deleteTodo(id);
     
     if (res.success && todoToDelete) {
         showToast(
           <span>
             Gelöscht. <button className="underline font-bold ml-2" onClick={() => createTodo(todoToDelete.title, todoToDelete.shared)}>Rückgängig</button>
           </span>, 
           'info'
         );
     } else {
         showToast(res.error || "Fehler beim Löschen", 'error');
     }
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'shared') return t.shared;
    if (filter === 'private') return !t.shared;
    return true;
  });

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <FadeIn>
        <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
          
          {error && <ErrorBanner message={error} onRetry={refetch} />}

          <header className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">Aufgaben</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Produktiv tun. Aufgabe eintragen.</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
              {['all', 'private', 'shared'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-500 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {f === 'all' ? 'Alle' : f === 'private' ? 'Ich' : 'Wir'}
                </button>
              ))}
            </div>
          </header>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-brand-200 dark:ring-brand-800">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={text} 
                onChange={e => setText(e.target.value)} 
                placeholder="Neue Aufgabe..." 
                className="flex-1 bg-transparent border-none focus:outline-none placeholder:text-slate-400 dark:text-slate-100" 
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
              <label className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${isShared ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="hidden" />
                {isShared ? <Users size={12} /> : <Lock size={12} />}
                {isShared ? 'Für beide' : 'Nur für mich'}
              </label>
            </div>
          </form>

          {loading ? (
            <SkeletonLoader type="todo" count={4} />
          ) : filteredTodos.length === 0 ? (
            <p className="text-center text-slate-400 dark:text-slate-600 py-8 text-sm">Alles erledigt! 🎉</p>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map(todo => (
                <SwipeableListItem key={todo.id} onDelete={() => handleDelete(todo.id)}>
                  <div className="group flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <button 
                      onClick={() => handleToggle(todo.id, todo.status)} 
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.status === 'done' ? 'bg-brand-400 border-brand-400' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                      {todo.status === 'done' && <CheckSquare size={14} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${todo.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{todo.title}</p>
                      {todo.shared && <span className="text-[10px] text-brand-500 dark:text-brand-400 flex items-center gap-1"><Users size={10}/> Gemeinsam</span>}
                    </div>
                    {/* Desktop Delete Button (visible on hover or non-mobile) */}
                    <button 
                      onClick={() => handleDelete(todo.id)} 
                      className="hidden md:block text-slate-300 hover:text-red-500 p-2 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </SwipeableListItem>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </PullToRefresh>
  );
}