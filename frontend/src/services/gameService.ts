import { db } from '@/config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, increment } from 'firebase/firestore';

export interface GameResult {
  userId: string;
  userEmail: string;
  userName: string;
  playerColor: 'w' | 'b';
  result: 'win' | 'loss' | 'draw';
  opponentName: string;
  moves: string[];
  finalPosition: string;
  timestamp: Date;
  duration?: number; // in seconds
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

// Save a completed game to Firestore
export const saveGameResult = async (gameData: GameResult): Promise<void> => {
  try {
    const gamesRef = collection(db, 'games');
    await addDoc(gamesRef, {
      ...gameData,
      timestamp: new Date(),
    });

    // Update user stats
    await updateUserStats(gameData.userId, gameData.result);
  } catch (error) {
    console.error('Error saving game result:', error);
    throw error;
  }
};

// Update user statistics. `setDoc({ merge: true })` creates the document on the
// first game and increments thereafter, so a new user's first result is never lost.
const updateUserStats = async (userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> => {
  const statsRef = doc(db, 'userStats', userId);
  const perResult = { win: 'wins', loss: 'losses', draw: 'draws' } as const;

  await setDoc(
    statsRef,
    {
      gamesPlayed: increment(1),
      [perResult[result]]: increment(1),
    },
    { merge: true },
  );
};

// Get user's recent games
export const getUserRecentGames = async (userId: string, limitCount: number = 10): Promise<GameResult[]> => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(
      gamesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const games: GameResult[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      games.push({
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        playerColor: data.playerColor,
        result: data.result,
        opponentName: data.opponentName,
        moves: data.moves,
        finalPosition: data.finalPosition,
        timestamp: data.timestamp?.toDate() || new Date(),
        duration: data.duration,
      });
    });

    return games;
  } catch (error) {
    console.error('Error fetching recent games:', error);
    return [];
  }
};

const EMPTY_STATS: UserStats = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };

// Get user statistics
export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    const snapshot = await getDoc(doc(db, 'userStats', userId));
    if (!snapshot.exists()) return EMPTY_STATS;

    const data = snapshot.data();
    return {
      gamesPlayed: data.gamesPlayed ?? 0,
      wins: data.wins ?? 0,
      losses: data.losses ?? 0,
      draws: data.draws ?? 0,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return EMPTY_STATS;
  }
};
