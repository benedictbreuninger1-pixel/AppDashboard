import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // NEU
import { FadeIn } from '../components/PageTransition';
import { Lock } from 'lucide-react';

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast(); // NEU
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validierung
    if (newPassword !== confirmPassword) {
      showToast('Die neuen Passwörter stimmen nicht überein', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Das neue Passwort muss mindestens 8 Zeichen lang sein', 'error');
      return;
    }

    setLoading(true);
    const result = await changePassword(oldPassword, newPassword);
    setLoading(false);

    if (result.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Passwort erfolgreich geändert!', 'success');
    } else {
      showToast(result.error || 'Passwort ändern fehlgeschlagen', 'error');
    }
  };

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Einstellungen</h1>
          <p className="text-slate-500 text-sm">Verwalte deinen Account</p>
        </div>

        {/* User Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Account</h2>
          <div className="text-sm text-slate-600">
            <p><strong>Benutzername:</strong> {user?.username || user?.email}</p>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Passwort ändern</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Neues Passwort wiederholen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-200 outline-none"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !oldPassword || !newPassword || !confirmPassword}
              className="w-full bg-brand-400 text-white py-2 rounded-lg hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Wird geändert...' : 'Passwort ändern'}
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}