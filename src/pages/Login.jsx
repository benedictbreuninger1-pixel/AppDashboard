import React, { useState } from 'react';
// WICHTIG: Wir importieren jetzt aus dem neuen Context, nicht mehr aus dem Store
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  // State für Username statt Email
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Login-Funktion aus dem neuen Context holen
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Alten Fehler löschen
    
    // Wir übergeben jetzt username statt email
    const res = await login(username, password);
    
    if (res.success) {
      navigate('/');
    } else {
      // Fehlermeldung angepasst
      setError('Login fehlgeschlagen. Benutzername oder Passwort falsch.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">BeneDashboard</h1>
        <p className="text-gray-500 mb-8">Willkommen zurück!</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            {/* Label geändert */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Benutzername</label>
            <input
              type="text" 
              placeholder="Dein Username"
              value={username} 
              onChange={e => setUsername(e.target.value)}
              // Autocomplete für Username hilft Browsern beim Speichern
              autoComplete="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
            <input
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Anmelden
          </button>
        </form>
        
        <p className="text-xs text-gray-400 mt-6 text-center">
          Private App für Bene & Freundin
        </p>
      </div>
    </div>
  );
}