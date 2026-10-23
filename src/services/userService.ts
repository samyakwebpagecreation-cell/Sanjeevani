/**
 * Sanjeevani v2 - Centralized User State & App Data Service
 * Manages persistent user progress, XP, Level, Badges, Incident History,
 * Bookmarks, and Readiness Index across all tabs.
 */

import { IncidentLog } from '../types';
import { auth } from '../firebase/config';
import { saveUserToFirestore, getUserFromFirestore, saveIncidentToFirestore } from '../firebase/db';
import { onAuthStateChanged } from 'firebase/auth';

export interface UserStats {
  xp: number;
  level: number;
  readinessScore: number; // 0 - 100%
  streakDays: number;
  lastActiveDate: string;
  completedScenarioIds: string[];
  drillsCompleted: number;
  cprBestAccuracy: number;
  mythBustersSolved: number;
  questsCompleted: string[]; // e.g. ['login', 'quiz', 'cpr', 'library']
}

const STORAGE_KEYS = {
  STATS: 'sanjeevani_user_stats',
  INCIDENTS: 'sanjeevani_incidents',
  BOOKMARKS: 'sanjeevani_bookmarks',
  RECENTS: 'sanjeevani_recents'
};

const EVENT_NAME = 'sanjeevani_state_updated';

// Default initial state
const DEFAULT_STATS: UserStats = {
  xp: 180,
  level: 1,
  readinessScore: 68,
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedScenarioIds: ['scen-1'],
  drillsCompleted: 1,
  cprBestAccuracy: 94,
  mythBustersSolved: 2,
  questsCompleted: ['login']
};

class UserService {
  private stats: UserStats;
  private incidents: IncidentLog[];
  private bookmarks: string[];
  private recents: string[];
  private currentUserId: string | null = null;
  private isCloudSynced: boolean = false;

  constructor() {
    this.stats = this.loadStats();
    this.incidents = this.loadIncidents();
    this.bookmarks = this.loadBookmarks();
    this.recents = this.loadRecents();
    this.recomputeReadiness();
    this.setupCloudAuthSync();
  }

  private setupCloudAuthSync() {
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.currentUserId = user.uid;
          try {
            const cloud = await getUserFromFirestore(user.uid);
            if (cloud?.stats) {
              this.stats = { ...this.stats, ...cloud.stats };
              localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
            }
            if (cloud?.bookmarks) {
              this.bookmarks = Array.from(new Set([...this.bookmarks, ...cloud.bookmarks]));
              localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(this.bookmarks));
            }
            this.isCloudSynced = true;
            this.recomputeReadiness();
            this.notify();
          } catch (err) {
            console.warn('Firestore initial sync fallback to local cache:', err);
          }
        } else {
          this.currentUserId = null;
          this.isCloudSynced = false;
        }
      });
    }
  }

  public getIsCloudSynced(): boolean {
    return this.isCloudSynced;
  }

  // ---- Persistence Helpers ----
  private loadStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_STATS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load user stats from localStorage', e);
    }
    return { ...DEFAULT_STATS };
  }

  private saveStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Failed to save user stats', e);
    }
    if (this.currentUserId) {
      saveUserToFirestore(this.currentUserId, {}, this.stats, this.bookmarks);
    }
    this.notify();
  }

  private loadIncidents(): IncidentLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load incidents', e);
    }
    // Default initial demonstration incident for first-time responders
    return [
      {
        id: 'inc-demo-01',
        protocolId: 'burn',
        protocolTitle: 'Kitchen Thermal Burn (Forearm)',
        startedAt: new Date(Date.now() - 86400000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completedAt: new Date(Date.now() - 86400000 * 2 + 180000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: 180,
        stepsCompleted: [
          'Removed from heat source',
          'Cooled under running tap water for 15 mins',
          'Covered with sterile non-adherent dressing'
        ],
        escalationTriggered: false,
        sensorObservations: ['Camera cooling confirmation verified']
      }
    ];
  }

  private saveIncidents() {
    try {
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(this.incidents));
    } catch (e) {
      console.warn('Failed to save incidents', e);
    }
    this.notify();
  }

  private loadBookmarks(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load bookmarks', e);
    }
    // Default helpful starter bookmarks matching library IDs
    return ['minor-cut', 'first-degree-burn', 'choking-adult'];
  }

  private saveBookmarks() {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(this.bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks', e);
    }
    if (this.currentUserId) {
      saveUserToFirestore(this.currentUserId, {}, this.stats, this.bookmarks);
    }
    this.notify();
  }

  private loadRecents(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load recents', e);
    }
    return ['cpr-adult', 'bleeding-wound'];
  }

  private saveRecents() {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(this.recents));
    } catch (e) {
      console.warn('Failed to save recents', e);
    }
    this.notify();
  }

  private notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { stats: this.stats } }));
    }
  }

  // Recompute Level and Readiness Score
  private recomputeReadiness() {
    // XP to Level: Level 1 (0-299), Level 2 (300-599), Level 3 (600+)
    const calculatedLevel = Math.max(1, Math.floor(this.stats.xp / 300) + 1);
    this.stats.level = calculatedLevel;

    // Readiness score calculation based on real accomplishments
    // Base 50 + scenarios (up to 20) + drills (up to 15) + incident count (up to 10) + bookmarks (up to 5)
    const scenarioScore = Math.min(20, this.stats.completedScenarioIds.length * 5);
    const drillScore = Math.min(15, this.stats.drillsCompleted * 5);
    const incidentScore = Math.min(10, this.incidents.length * 5);
    const bookmarkScore = Math.min(5, this.bookmarks.length * 1.5);
    
    const computed = Math.min(99, Math.round(50 + scenarioScore + drillScore + incidentScore + bookmarkScore));
    this.stats.readinessScore = computed;
  }

  // ---- Public API ----
  public getStats(): UserStats {
    return { ...this.stats };
  }

  public getNextLevelThreshold(): { currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
    const level = this.stats.level;
    const currentBase = (level - 1) * 300;
    const nextTarget = level * 300;
    const xpInLevel = this.stats.xp - currentBase;
    const progressPercent = Math.min(100, Math.round((xpInLevel / 300) * 100));
    return {
      currentLevelXp: this.stats.xp,
      nextLevelXp: nextTarget,
      progressPercent
    };
  }

  public addXp(amount: number, reason?: string): { newXp: number; levelUp: boolean } {
    const oldLevel = this.stats.level;
    this.stats.xp += amount;
    this.recomputeReadiness();
    const levelUp = this.stats.level > oldLevel;
    this.saveStats();
    return { newXp: this.stats.xp, levelUp };
  }

  public recordQuizCompletion(quizId: string, isCorrect: boolean, earnedXp: number = 25) {
    if (!this.stats.completedScenarioIds.includes(quizId)) {
      this.stats.completedScenarioIds.push(quizId);
    }
    if (isCorrect) {
      this.stats.xp += earnedXp;
    }
    this.completeQuest('drill');
    this.recomputeReadiness();
    this.saveStats();
  }

  public recordDrillCompletion(score: number, earnedXp: number = 30) {
    this.stats.drillsCompleted += 1;
    if (score > this.stats.cprBestAccuracy) {
      this.stats.cprBestAccuracy = score;
    }
    this.stats.xp += earnedXp;
    this.completeQuest('cpr');
    this.recomputeReadiness();
    this.saveStats();
  }

  public recordMythBusterSolved(earnedXp: number = 15) {
    this.stats.mythBustersSolved += 1;
    this.stats.xp += earnedXp;
    this.recomputeReadiness();
    this.saveStats();
  }

  public completeQuest(questId: string, rewardXp?: number) {
    if (!this.stats.questsCompleted.includes(questId)) {
      this.stats.questsCompleted.push(questId);
      if (rewardXp) {
        this.stats.xp += rewardXp;
      }
      this.recomputeReadiness();
      this.saveStats();
    }
  }

  // ---- Incidents ----
  public getIncidents(): IncidentLog[] {
    return [...this.incidents];
  }

  public addIncident(log: IncidentLog) {
    this.incidents.unshift(log);
    this.stats.xp += 40;
    this.recomputeReadiness();
    this.saveIncidents();
    this.saveStats();
    if (this.currentUserId) {
      saveIncidentToFirestore(this.currentUserId, log);
    }
  }

  // ---- Bookmarks ----
  public getBookmarks(): string[] {
    return [...this.bookmarks];
  }

  public isBookmarked(entryId: string): boolean {
    return this.bookmarks.includes(entryId);
  }

  public toggleBookmark(entryId: string): boolean {
    const idx = this.bookmarks.indexOf(entryId);
    let isNowBookmarked = false;
    if (idx >= 0) {
      this.bookmarks.splice(idx, 1);
      isNowBookmarked = false;
    } else {
      this.bookmarks.push(entryId);
      isNowBookmarked = true;
      this.completeQuest('library');
    }
    this.recomputeReadiness();
    this.saveBookmarks();
    this.saveStats();
    return isNowBookmarked;
  }

  // ---- Recents ----
  public getRecents(): string[] {
    return [...this.recents];
  }

  public addRecentView(entryId: string) {
    this.recents = [entryId, ...this.recents.filter(id => id !== entryId)].slice(0, 10);
    this.saveRecents();
  }

  // ---- Subscription ----
  public subscribe(callback: (stats: UserStats) => void): () => void {
    const handler = (event: any) => {
      callback(event.detail?.stats || this.getStats());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_NAME, handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_NAME, handler);
      }
    };
  }
}

export const userService = new UserService();
