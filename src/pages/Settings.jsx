import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext"; // NEU
import { FadeIn } from "../components/PageTransition";
import { Lock, Check, X, Moon, Sun, Smartphone } from "lucide-react";
import { pb } from "../lib/pocketbase";

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme(); // NEU

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Haptics Setting
  const hapticsEnabled = user?.haptics_enabled ?? true;

  const toggleHaptics = async () => {
    const newValue = !hapticsEnabled;
    try {
      await pb
        .collection("users")
        .update(user.id, { haptics_enabled: newValue });
      // UI updated automatisch via AuthContext subscription
    } catch (err) {
      console.error(err); // <--- Hier nutzen wir die Variable jetzt
      showToast("Konnte Einstellung nicht speichern", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Die neuen Passwörter stimmen nicht überein", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast(
        "Das neue Passwort muss mindestens 8 Zeichen lang sein",
        "error"
      );
      return;
    }
    setLoading(true);
    const result = await changePassword(oldPassword, newPassword);
    setLoading(false);
    if (result.success) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Passwort erfolgreich geändert!", "success");
    } else {
      showToast(result.error || "Passwort ändern fehlgeschlagen", "error");
    }
  };

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            Einstellungen
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Verwalte deinen Account
          </p>
        </div>

        {/* Darstellung */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Moon size={20} className="text-slate-600 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Darstellung
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["system", "light", "dark"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  theme === t
                    ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {t === "system" ? "System" : t === "light" ? "Hell" : "Dunkel"}
              </button>
            ))}
          </div>
        </div>

        {/* Haptik */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone
                size={20}
                className="text-slate-600 dark:text-slate-300"
              />
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Vibration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Haptisches Feedback bei Aktionen
                </p>
              </div>
            </div>
            <button
              onClick={toggleHaptics}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                hapticsEnabled
                  ? "bg-brand-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  hapticsEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={20} className="text-slate-600 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Passwort ändern
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Wiederholen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-800 outline-none dark:bg-slate-800 dark:text-slate-100"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={
                loading || !oldPassword || !newPassword || !confirmPassword
              }
              className="w-full bg-brand-400 text-white py-2 rounded-lg hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Wird geändert..." : "Passwort ändern"}
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
