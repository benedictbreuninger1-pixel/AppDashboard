import React, { useState } from 'react';
import { useShoppingList } from '../hooks/useShoppingList';
import { Plus, Trash2, Check, ShoppingCart, Users, Lock } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { FadeIn } from '../components/PageTransition';

export default function ShoppingListPage() {
  const { items, loading, createItem, toggleStatus, deleteItem } = useShoppingList();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isShared, setIsShared] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createItem(name, amount, isShared);
    setName('');
    setAmount('');
    setIsShared(false);
  };

  const openItems = items.filter(item => item.status === 'open');
  const boughtItems = items.filter(item => item.status === 'bought');

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Einkaufsliste</h1>
          <p className="text-slate-500 text-sm">Was brauchen wir?</p>
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Was einkaufen?"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-200 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Menge (z.B. 2kg, 500g)"
              className="w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-200 outline-none"
            />
            <button
              type="submit"
              disabled={!name}
              className="px-6 py-2 bg-brand-400 text-white rounded-lg hover:bg-brand-500 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <label className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${isShared ? 'bg-brand-100 text-brand-600' : 'bg-slate-50 text-slate-500'}`}>
            <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="hidden" />
            {isShared ? <Users size={12} /> : <Lock size={12} />}
            {isShared ? 'Für beide' : 'Nur für mich'}
          </label>
        </form>

        {/* Loading State */}
        {loading && <SkeletonLoader type="todo" count={3} />}

        {/* Open Items */}
        {!loading && openItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShoppingCart size={16} />
              Zu kaufen ({openItems.length})
            </h2>
            <div className="space-y-2">
              {openItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                  <button
                    onClick={() => toggleStatus(item.id, item.status)}
                    className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center hover:border-brand-400 transition-colors"
                  >
                    {/* Empty checkbox */}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-800 font-medium">{item.name}</span>
                      {item.amount && (
                        <span className="text-xs text-slate-500">{item.amount}</span>
                      )}
                    </div>
                    {item.shared && (
                      <span className="text-[10px] text-brand-500 flex items-center gap-1 mt-1">
                        <Users size={10}/> Gemeinsam
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bought Items (collapsed) */}
        {!loading && boughtItems.length > 0 && (
          <details className="group">
            <summary className="text-sm font-semibold text-slate-500 cursor-pointer flex items-center gap-2 hover:text-slate-700 transition-colors">
              <Check size={16} />
              Gekauft ({boughtItems.length})
            </summary>
            <div className="space-y-2 mt-3">
              {boughtItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg opacity-60">
                  <button
                    onClick={() => toggleStatus(item.id, item.status)}
                    className="w-5 h-5 rounded-full bg-brand-400 flex items-center justify-center text-white"
                  >
                    <Check size={12} />
                  </button>
                  <span className="text-sm text-slate-500 line-through flex-1">{item.name}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">Einkaufsliste ist leer</p>
        )}
      </div>
    </FadeIn>
  );
}