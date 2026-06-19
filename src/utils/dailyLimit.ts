// ── Freemium daily-play limit (localStorage) ─────────────────────────────────
// Stores { date: "YYYY-MM-DD", gamesPlayed: number }. When the stored date is no
// longer today, the counter resets to 0. All access is guarded for SSR / private
// mode where `localStorage` may be unavailable or throw.

export const MAX_FREE_GAMES = 3;
const STORAGE_KEY = "chronoMap_daily";

/**
 * Daily limit temporarily DISABLED everywhere ("deocamdată"). The per-day
 * counter logic below is kept intact — to re-enable the freemium gate, restore
 * this to the localhost-only check.
 */
export function isUnlimited(): boolean {
  return true;
}

export interface DailyRecord {
  date: string;
  gamesPlayed: number;
}

/** Local calendar day as YYYY-MM-DD (not UTC, so the reset matches the player). */
function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Today's record, auto-reset when the saved date is stale or data is corrupt. */
export function getDailyRecord(): DailyRecord {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyRecord>;
      if (parsed && parsed.date === today && typeof parsed.gamesPlayed === "number") {
        return { date: today, gamesPlayed: Math.max(0, parsed.gamesPlayed) };
      }
    }
  } catch {
    /* ignore — fall through to a fresh record */
  }
  return { date: today, gamesPlayed: 0 };
}

/** Games still available today (0…MAX_FREE_GAMES). */
export function getGamesRemaining(): number {
  if (isUnlimited()) return MAX_FREE_GAMES; // always show a full bar on localhost
  return Math.max(0, MAX_FREE_GAMES - getDailyRecord().gamesPlayed);
}

/** True while the player still has free games left today. */
export function canPlay(): boolean {
  if (isUnlimited()) return true;
  return getDailyRecord().gamesPlayed < MAX_FREE_GAMES;
}

/** Increment today's counter (call when a game actually starts). */
export function recordGamePlayed(): DailyRecord {
  if (isUnlimited()) return getDailyRecord(); // no-op on localhost
  const current = getDailyRecord();
  const next: DailyRecord = { date: todayKey(), gamesPlayed: current.gamesPlayed + 1 };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
