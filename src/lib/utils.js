/**
 * Übersetzt PocketBase- oder Netzwerkfehler in benutzerfreundliche Nachrichten.
 */
export function formatError(error) {
  if (!error) return null;

  // PocketBase spezifische Fehler
  if (error.status === 0) return 'Keine Internetverbindung / Netzwerkfehler.';
  if (error.status === 404) return 'Eintrag nicht gefunden.';
  if (error.status === 403) return 'Keine Berechtigung für diese Aktion.';
  if (error.status === 400) {
    // Versuche, Validierungsfehler auszulesen (z.B. "data.title.message")
    const data = error.response?.data;
    if (data) {
      const firstKey = Object.keys(data)[0];
      if (firstKey && data[firstKey]?.message) {
        return `${firstKey}: ${data[firstKey].message}`;
      }
    }
    return 'Eingabedaten ungültig.';
  }

  return error.message || 'Ein unbekannter Fehler ist aufgetreten.';
}