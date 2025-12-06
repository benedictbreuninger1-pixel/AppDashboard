/**
 * Übersetzt PocketBase- oder Netzwerkfehler in benutzerfreundliche Nachrichten.
 */
export function formatError(error) {
  if (!error) return null;

  // PocketBase spezifische Fehler
  if (error.status === 0) return 'Keine Internetverbindung / Netzwerkfehler.';
  if (error.status === 404) return 'Eintrag nicht gefunden.';
  if (error.status === 403) return 'Keine Berechtigung für diese Aktion.';
  if (error.status === 400) {
    const data = error.response?.data;
    if (data) {
      const firstKey = Object.keys(data)[0];
      if (firstKey && data[firstKey]?.message) {
        return `${firstKey}: ${data[firstKey].message}`;
      }
    }
    return 'Eingabedaten ungültig.';
  }

  return error.message || 'Ein unbekannter Fehler ist aufgetreten.';
}

/**
 * Auto-Kategorisierung für Einkaufsliste
 */
const CATEGORY_KEYWORDS = {
  'Obst & Gemüse': ['apfel', 'banane', 'tomate', 'gurke', 'karotte', 'zwiebel', 'paprika', 'salat', 'orange', 'zitrone', 'beeren', 'traube'],
  'Fleisch & Fisch': ['hähnchen', 'hack', 'rind', 'schwein', 'wurst', 'lachs', 'thunfisch', 'garnele', 'fisch'],
  'Milchprodukte': ['milch', 'käse', 'joghurt', 'butter', 'sahne', 'quark', 'frischkäse'],
  'Brot & Backwaren': ['brot', 'brötchen', 'toast', 'croissant', 'kuchen'],
  'Trockenware': ['reis', 'nudeln', 'mehl', 'zucker', 'salz', 'pfeffer', 'gewürz', 'öl', 'essig'],
  'Getränke': ['wasser', 'saft', 'tee', 'kaffee', 'cola', 'bier', 'wein', 'limonade'],
  'Tiefkühl': ['pizza', 'eis', 'tiefkühl', 'gefror'],
  'Süßwaren': ['schokolade', 'keks', 'süßigkeit', 'bonbon', 'gummi'],
};

export function categorizeItem(name) {
  if (!name) return null;
  
  const normalized = name.toLowerCase().trim();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return category;
    }
  }
  
  return null;
}

/**
 * Formatiert ein Datum für die Todo-Anzeige
 */
export function formatDueDate(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time for comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: 'Überfällig', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' };
  if (diffDays === 0) return { label: 'Heute', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' };
  if (diffDays === 1) return { label: 'Morgen', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
  if (diffDays <= 7) {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return { label: days[date.getDay()], color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-800' };
  }
  
  // Format: "10. März"
  const options = { day: 'numeric', month: 'short' };
  return { label: date.toLocaleDateString('de-DE', options), color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-800' };
}

/**
 * Priority-Visualisierung
 */
export function getPriorityConfig(priority) {
  const configs = {
    high: { label: 'Hoch', color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
    medium: { label: 'Mittel', color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
    low: { label: 'Niedrig', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
  };
  return configs[priority] || null;
}

/**
 * Recurrence Icon Helper
 */
export function getRecurrenceIcon(recurrence) {
  const icons = {
    daily: '🔄',
    weekly: '📅',
    monthly: '📆',
  };
  return icons[recurrence] || null;
}

/**
 * Berechnet nächstes Fälligkeitsdatum für wiederkehrende Todos
 */
export function getNextDueDate(currentDueDate, recurrence) {
  if (!currentDueDate || !recurrence || recurrence === 'none') return null;
  
  const date = new Date(currentDueDate);
  
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Debounce Helper
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}