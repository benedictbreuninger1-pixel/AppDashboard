// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // WICHTIG: Hier ändern! Das "pb.authStore.model" muss direkt in die Klammer:
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Hier KEIN setUser mehr aufrufen! Nur noch den Listener:
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
      await pb.collection('users').authWithPassword(username, password);
      return { success: true };
    } catch (error) {
      setLoading(false);
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