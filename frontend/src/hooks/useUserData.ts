import { useEffect, useState } from "react";
import {
  getUserStats,
  getUserRecentGames,
  type UserStats,
  type GameResult,
} from "@/services/gameService";

const EMPTY_STATS: UserStats = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };

interface CachedPayload {
  stats: UserStats;
  games: GameResult[];
}

/**
 * Loads the user's stats and recent games with a stale-while-revalidate
 * strategy: the last known values are painted instantly from localStorage,
 * then refreshed from Firestore in the background. Repeat visits feel
 * instantaneous; the first-ever visit falls back to skeletons (`loading`).
 */
export function useUserData(uid: string | undefined) {
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const cacheKey = `gambit:userdata:${uid}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed: CachedPayload = JSON.parse(cached);
        setStats(parsed.stats);
        setGames(parsed.games.map((g) => ({ ...g, timestamp: new Date(g.timestamp) })));
        setLoading(false);
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    let active = true;
    Promise.all([getUserStats(uid), getUserRecentGames(uid, 5)])
      .then(([nextStats, nextGames]) => {
        if (!active) return;
        setStats(nextStats);
        setGames(nextGames);
        localStorage.setItem(cacheKey, JSON.stringify({ stats: nextStats, games: nextGames }));
      })
      .catch((err) => console.error("Error fetching user data:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [uid]);

  return { stats, games, loading };
}
