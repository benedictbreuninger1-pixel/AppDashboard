import { useAuth } from '../context/AuthContext';

export function useHaptics() {
  const { user } = useAuth();
  // Default Logik: true wenn undefined/null
  const enabled = user?.haptics_enabled ?? true;

  function vibrate(pattern = 10) {
    if (!enabled) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  return { vibrate };
}