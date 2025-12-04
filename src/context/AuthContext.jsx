// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: newPassword,
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.oldPassword?.message || error.message || 'Passwort ändern fehlgeschlagen'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);