import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { pb } from '../lib/pocketbase';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  
  // 1. Aktuelles Theme (Einstellung)
  const [theme, setThemeState] = useState(() => {
    if (user?.theme) return user.theme;
    return localStorage.getItem('app_theme') || 'system';
  });

  // 2. System-Präferenz live tracken
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => 
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => setSystemPrefersDark(e.matches);
    
    // Listener hinzufügen
    media.addEventListener('change', listener);
    
    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, []);

  // 3. User-Einstellung synchronisieren (Fix für Fehler 1)
  // Wir hören NUR auf user.theme (String), nicht auf das ganze user Objekt.
  // Wir entfernen 'theme' aus den Deps, um Zyklen zu vermeiden.
  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      setThemeState(user.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.theme]); 

  // 4. Resolved Theme berechnen (Fix für Fehler 2)
  // Das ist "Derived State" -> Kein useState/useEffect nötig!
  const resolvedTheme = theme === 'system' 
    ? (systemPrefersDark ? 'dark' : 'light') 
    : theme;

  // 5. DOM aktualisieren (Side Effect)
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('app_theme', theme);
  }, [resolvedTheme, theme]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    
    // Wenn eingeloggt, speichere Preference in DB
    if (user) {
      try {
        await pb.collection('users').update(user.id, { theme: newTheme });
      } catch (err) {
        console.error("Failed to save theme preference", err);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);