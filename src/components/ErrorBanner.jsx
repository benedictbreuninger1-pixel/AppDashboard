import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 flex items-start gap-3 animate-fadeIn">
      <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="text-sm text-red-700 dark:text-red-300 font-medium">{message || "Ein Fehler ist aufgetreten."}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-sm font-semibold text-red-700 dark:text-red-300 hover:underline flex items-center gap-1"
        >
          <RefreshCw size={14} /> Wiederholen
        </button>
      )}
    </div>
  );
}