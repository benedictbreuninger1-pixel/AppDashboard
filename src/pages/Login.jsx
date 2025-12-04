import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const res = await login(username, password);
    
    if (res.success) {
      navigate('/');
    } else {
      setError('Login fehlgeschlagen. Benutzername oder Passwort falsch.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-brand-100">
        <h1 className="text-3xl font-bold text-brand-700 mb-8">Plan & Plate</h1>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-600 mb-2">Benutzername</label>
            <input
              type="text" 
              placeholder="Dein Benutzername"
              value={username} 
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full px-4 py-3 border border-brand-200 rounded-xl focus:ring-2 focus:ring-brand-300 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-600 mb-2">Passwort</label>
            <input
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-brand-200 rounded-xl focus:ring-2 focus:ring-brand-300 focus:border-transparent outline-none transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button 
            type="submit" 
            className="w-full bg-brand-400 text-white py-3 rounded-xl font-medium hover:bg-brand-500 active:bg-brand-600 transition-colors shadow-lg shadow-brand-200"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}