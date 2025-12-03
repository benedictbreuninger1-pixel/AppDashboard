import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Zeige nichts (oder einen Spinner) solange der Auth-Status geprüft wird
  if (loading) return <div className="p-10 text-center">Lade Authentifizierung...</div>;

  // Wenn kein User da ist -> Redirect zum Login
  if (!user) return <Navigate to="/login" replace />;

  // Wenn User da ist -> Zeige die angeforderte Seite (Outlet)
  return <Outlet />;
}