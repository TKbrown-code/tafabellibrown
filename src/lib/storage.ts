// Safe wrapper: localStorage may be blocked (sandboxed iframes, privacy modes).
export const safeStorage = {
  get(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
  },
};

export function storageAvailable(): boolean {
  try { const k = "__t"; window.localStorage.setItem(k, k); window.localStorage.removeItem(k); return true; } catch { return false; }
}
