import React, { useState } from 'react';
import { useTodos } from '../hooks/useData';
import { Plus, Trash2, Users, Lock, CheckSquare } from 'lucide-react';

export default function TodosPage() {
  const { todos, createTodo, toggleTodo, deleteTodo, loading } = useTodos();
  const [text, setText] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    createTodo(text, isShared);
    setText('');
    setIsShared(false);
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'shared') return t.shared;
    if (filter === 'private') return !t.shared;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
      <header className="flex justify-between items-end">
        <h1 className="text-2xl font-bold text-slate-800">Aufgaben</h1>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {['all', 'private', 'shared'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
              {f === 'all' ? 'Alle' : f === 'private' ? 'Ich' : 'Wir'}
            </button>
          ))}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 focus-within:ring-2 ring-indigo-100">
        <div className="flex gap-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Neue Aufgabe..." className="flex-1 bg-transparent border-none focus:outline-none placeholder:text-slate-400" />
          <button type="submit" disabled={!text} className="bg-indigo-600 text-white p-2 rounded-xl disabled:opacity-50"><Plus size={20} /></button>
        </div>
        <div className="mt-2">
          <label className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer ${isShared ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-500'}`}>
            <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="hidden" />
            {isShared ? <Users size={12} /> : <Lock size={12} />}
            {isShared ? 'Für beide' : 'Nur für mich'}
          </label>
        </div>
      </form>

      <div className="space-y-2">
        {loading ? <p className="text-center text-slate-400 py-8">Lade...</p> : 
         filteredTodos.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">Alles erledigt! 🎉</p> :
         filteredTodos.map(todo => (
          <div key={todo.id} className="group flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <button onClick={() => toggleTodo(todo.id, todo.status)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${todo.status === 'done' ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
              {todo.status === 'done' && <CheckSquare size={14} className="text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`truncate ${todo.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{todo.title}</p>
              {todo.shared && <span className="text-[10px] text-indigo-500 flex items-center gap-1"><Users size={10}/> Gemeinsam</span>}
            </div>
            <button onClick={() => deleteTodo(todo.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}