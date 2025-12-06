import React, { useState, useMemo } from 'react';
import { useTodos } from '../hooks/useTodos';
import { useToast } from '../context/ToastContext';
import { Plus, Users, Lock, CheckSquare, Trash2, Calendar, Tag, MoreVertical, X } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { FadeIn } from '../components/PageTransition';
import PullToRefresh from '../components/PullToRefresh';
import ErrorBanner from '../components/ErrorBanner';
import SwipeableListItem from '../components/SwipeableListItem';
import { formatDueDate, getPriorityConfig, getRecurrenceIcon } from '../lib/utils';

export default function TodosPage() {
  const { todos, createTodo, toggleTodo, deleteTodo, createSubtask, toggleSubtask, deleteSubtask, refetch, loading, error } = useTodos();
  const { showToast } = useToast();
  
  const [text, setText] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Expanded Todo Details
  const [expandedTodoId, setExpandedTodoId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shared: false,
    due_date: '',
    priority: '',
    tags: '',
    recurrence: 'none',
    subtasks: [],
  });

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const res = await createTodo({ title: text, shared: isShared });
    
    if (res.success) {
        setText('');
        setIsShared(false);
        showToast('Aufgabe hinzugefügt!', 'success');
    } else {
        showToast(res.error, 'error');
    }
  };

  const handleFullSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const res = await createTodo(formData);
    
    if (res.success) {
        setFormData({
          title: '',
          description: '',
          shared: false,
          due_date: '',
          priority: '',
          tags: '',
          recurrence: 'none',
          subtasks: [],
        });
        setShowAddForm(false);
        showToast('Aufgabe erstellt!', 'success');
    } else {
        showToast(res.error, 'error');
    }
  };

  const handleToggle = async (id, status) => {
     const res = await toggleTodo(id, status);
     if (!res.success) showToast(res.error, 'error');
     else if (res.success) {
       const todo = todos.find(t => t.id === id);
       if (todo?.recurrence && todo.recurrence !== 'none' && status === 'open') {
         showToast('✅ Erledigt! Nächstes Todo erstellt', 'success');
       }
     }
  };

  const handleDelete = async (id) => {
     const todoToDelete = todos.find(t => t.id === id);
     
     const res = await deleteTodo(id);
     
     if (res.success && todoToDelete) {
         showToast(
           <span>
             Gelöscht. <button className="underline font-bold ml-2" onClick={() => createTodo(todoToDelete)}>Rückgängig</button>
           </span>, 
           'info'
         );
     } else {
         showToast(res.error || "Fehler beim Löschen", 'error');
     }
  };

  const handleAddSubtask = async (todoId) => {
    const title = prompt('Subtask-Titel:');
    if (!title?.trim()) return;
    
    const res = await createSubtask(todoId, title);
    if (!res.success) showToast(res.error, 'error');
  };

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      const matchesShared = filter === 'all' || 
        (filter === 'shared' && t.shared) || 
        (filter === 'private' && !t.shared);
      
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      
      return matchesShared && matchesPriority;
    });
  }, [todos, filter, priorityFilter]);

  const TodoItem = ({ todo }) => {
    const isExpanded = expandedTodoId === todo.id;
    const dueDateInfo = formatDueDate(todo.due_date);
    const priorityConfig = getPriorityConfig(todo.priority);
    const recurrenceIcon = getRecurrenceIcon(todo.recurrence);
    const subtasks = todo.expand?.todo_subtasks_via_todo || [];
    const subtasksDone = subtasks.filter(s => s.done).length;

    return (
      <SwipeableListItem onDelete={() => handleDelete(todo.id)}>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <button 
              onClick={() => handleToggle(todo.id, todo.status)} 
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${todo.status === 'done' ? 'bg-brand-400 border-brand-400' : 'border-slate-300 dark:border-slate-600'}`}
            >
              {todo.status === 'done' && <CheckSquare size={14} className="text-white" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <p className={`flex-1 ${todo.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {todo.title}
                </p>
                {priorityConfig && (
                  <div className={`w-2 h-2 rounded-full ${priorityConfig.color} shrink-0 mt-2`} title={priorityConfig.label} />
                )}
              </div>
              
              {/* Meta Info */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {dueDateInfo && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${dueDateInfo.bgColor} ${dueDateInfo.color} font-medium`}>
                    {dueDateInfo.label}
                  </span>
                )}
                {todo.tags && todo.tags.split(',').slice(0, 2).map((tag, i) => (
                  <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {tag.trim()}
                  </span>
                ))}
                {recurrenceIcon && (
                  <span className="text-xs" title={`Wiederholt: ${todo.recurrence}`}>{recurrenceIcon}</span>
                )}
                {subtasks.length > 0 && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    ✓ {subtasksDone}/{subtasks.length}
                  </span>
                )}
                {todo.shared && <Users size={10} className="text-brand-500 dark:text-brand-400" />}
              </div>
            </div>
            
            <button 
              onClick={() => setExpandedTodoId(isExpanded ? null : todo.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0"
            >
              <MoreVertical size={16} />
            </button>
            
            <button 
              onClick={() => handleDelete(todo.id)} 
              className="hidden md:block text-slate-300 hover:text-red-500 p-2 transition-colors shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              {todo.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{todo.description}</p>
              )}
              
              {/* Subtasks */}
              {subtasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subtasks</p>
                  {subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSubtask(sub.id, sub.done)}
                        className={`w-4 h-4 rounded border shrink-0 ${sub.done ? 'bg-brand-400 border-brand-400' : 'border-slate-300 dark:border-slate-600'}`}
                      >
                        {sub.done && <CheckSquare size={10} className="text-white" />}
                      </button>
                      <span className={`text-sm flex-1 ${sub.done ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {sub.title}
                      </span>
                      <button onClick={() => deleteSubtask(sub.id)} className="text-slate-300 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => handleAddSubtask(todo.id)}
                className="text-xs text-brand-500 hover:underline"
              >
                + Subtask hinzufügen
              </button>
            </div>
          )}
        </div>
      </SwipeableListItem>
    );
  };

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); }}>
      <FadeIn>
        <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
          
          {error && <ErrorBanner message={error} onRetry={refetch} />}

          <header className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">Aufgaben</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Produktiv bleiben</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-brand-400 text-white p-2 rounded-full shadow-lg hover:bg-brand-500"
              >
                {showAddForm ? <X size={20} /> : <Plus size={20} />}
              </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {['all', 'private', 'shared'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f)} 
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${filter === f ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-500 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {f === 'all' ? 'Alle' : f === 'private' ? 'Ich' : 'Wir'}
                  </button>
                ))}
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {['all', 'high', 'medium', 'low'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setPriorityFilter(p)} 
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${priorityFilter === p ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-500 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {p === 'all' ? 'Alle' : p === 'high' ? '🔴 Hoch' : p === 'medium' ? '🟠 Mittel' : '🔵 Niedrig'}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Extended Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-900/30 space-y-3">
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Aufgabentitel" 
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
              />
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Beschreibung (optional)" 
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100 min-h-[60px]"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Fälligkeit</label>
                  <input 
                    type="date" 
                    value={formData.due_date} 
                    onChange={e => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Priorität</label>
                  <select 
                    value={formData.priority} 
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Keine</option>
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Wiederholen</label>
                  <select 
                    value={formData.recurrence} 
                    onChange={e => setFormData({...formData, recurrence: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="none">Nie</option>
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Tags</label>
                  <input 
                    type="text" 
                    value={formData.tags} 
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                    placeholder="Arbeit, Privat" 
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              
              <label className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${formData.shared ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                <input type="checkbox" checked={formData.shared} onChange={e => setFormData({...formData, shared: e.target.checked})} className="hidden" />
                {formData.shared ? <Users size={12} /> : <Lock size={12} />}
                {formData.shared ? 'Für beide' : 'Nur für mich'}
              </label>
              
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleFullSubmit}
                  disabled={!formData.title}
                  className="flex-1 bg-brand-400 text-white py-2 rounded-lg hover:bg-brand-500 disabled:opacity-50"
                >
                  Erstellen
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Quick Add Form */}
          {!showAddForm && (
            <form onSubmit={handleQuickSubmit} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-brand-200 dark:ring-brand-800">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={text} 
                  onChange={e => setText(e.target.value)} 
                  placeholder="Schnell hinzufügen..." 
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
          )}

          {loading ? (
            <SkeletonLoader type="todo" count={4} />
          ) : filteredTodos.length === 0 ? (
            <p className="text-center text-slate-400 dark:text-slate-600 py-8 text-sm">Alles erledigt! 🎉</p>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map(todo => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </PullToRefresh>
  );
}