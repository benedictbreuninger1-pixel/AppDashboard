import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // FIX: Wir lesen den User SOFORT aus, nicht erst im useEffect.
  // Das verhindert den "cascading render" Fehler.
  const [user, setUser] = useState(pb.authStore.model);
  
  // Da wir den User sofort haben, brauchen wir 'loading' eigentlich nicht true setzen,
  // aber wir lassen es drin für Login-Vorgänge.
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Hier hören wir nur noch auf Änderungen (Login/Logout in der Zukunft)
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // Login mit Username
      await pb.collection('users').authWithPassword(username, password);
      // setUser wird automatisch durch den onChange Listener oben getriggert!
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);