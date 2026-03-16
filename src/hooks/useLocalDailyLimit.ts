/**
 * useLocalDailyLimit
 * Manages the 3-recipes-per-day limit entirely in localStorage.
 * No login or server calls required.
 */

const STORAGE_KEY_USES = "michef_recipes_today";
const STORAGE_KEY_DATE = "michef_recipes_date";
const DAILY_LIMIT = 3;

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readUsage(): { uses: number; date: string } {
  try {
    const date = localStorage.getItem(STORAGE_KEY_DATE) || "";
    const uses = parseInt(localStorage.getItem(STORAGE_KEY_USES) || "0", 10);
    return { uses: isNaN(uses) ? 0 : uses, date };
  } catch {
    return { uses: 0, date: "" };
  }
}

export function useLocalDailyLimit() {
  const today = getTodayStr();
  const { uses, date } = readUsage();
  const usesToday = date === today ? uses : 0;
  const remaining = Math.max(0, DAILY_LIMIT - usesToday);
  const isAtLimit = remaining === 0;

  /** Call before generating a recipe. Returns true if allowed. */
  const checkAndIncrement = (): boolean => {
    const current = readUsage();
    const today = getTodayStr();
    const currentUses = current.date === today ? current.uses : 0;
    if (currentUses >= DAILY_LIMIT) return false;
    try {
      localStorage.setItem(STORAGE_KEY_DATE, today);
      localStorage.setItem(STORAGE_KEY_USES, String(currentUses + 1));
    } catch { /* quota exceeded — still allow */ }
    return true;
  };

  return {
    usesToday,
    remaining,
    limit: DAILY_LIMIT,
    isAtLimit,
    checkAndIncrement,
  };
}
