import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // 1. Zuerst removeToast definieren, damit showToast es kennt
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 2. Dann showToast definieren
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatisches Entfernen nach 3 Sekunden
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]); // removeToast als Dependency hinzufügen

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn transition-all transform translate-y-0
              ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-100 text-red-700' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-100 text-blue-700' : ''}
            `}
            role="alert"
          >
            {toast.type === 'success' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
            {toast.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
            
            <p className="text-sm font-medium">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ESLint Warnung für Fast Refresh ignorieren, da Hook und Component zusammenhängen
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);