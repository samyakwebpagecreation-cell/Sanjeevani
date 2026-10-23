/**
 * Sanjeevani v2 - Firebase Firestore Database Service
 * Provides strongly-typed storage, real-time synchronization, and offline-first
 * persistence for users, emergency incidents, crowd squad sessions, and paramedic dockets.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { IncidentLog } from '../types';
import { UserStats } from '../services/userService';

// Types for Firebase Collections
export interface FirebaseUserProfile {
  uid: string;
  fullName: string;
  role: 'student' | 'parent' | 'responder';
  email?: string;
  phone?: string;
  createdAt: any;
  updatedAt: any;
}

import { SquadTaskRole } from '../services/bystanderSquadEngine';

export interface EmergencySquadSession {
  id: string;
  leaderId: string;
  leaderName: string;
  protocolId: string;
  protocolTitle: string;
  status: 'active' | 'resolved';
  locationNotes?: string;
  locationAddress?: string;
  incidentSummary?: string;
  urgencyLevel?: 'CRITICAL_112' | 'URGENT' | 'MONITOR';
  gpsCoordinates?: { lat: number; lng: number };
  nearestHospital?: {
    name: string;
    distance: string;
    eta: string;
    phone: string;
  };
  roles: Record<string, SquadTaskRole | any>;
  bystanderCount?: number;
  qrSvg?: string;
  joinUrl?: string;
  photoPreviewUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ParamedicDocket {
  id: string;
  incidentId: string;
  patientStatus: string;
  responderName: string;
  protocolTitle: string;
  startedAt: string;
  completedAt: string;
  totalDurationSeconds: number;
  cprDurationSeconds?: number;
  cprCyclesCount?: number;
  cprAverageAccuracy?: number;
  coolingMinutes?: number;
  pressureMinutes?: number;
  stepsCompleted: string[];
  vitalSignsObservations: string[];
  nearestHospitalDispatched?: string;
  qrPayload: string;
  createdAt: any;
}

// -------------------------------------------------------------
// 1. User & Stats Collection: users/{uid}
// -------------------------------------------------------------
export async function saveUserToFirestore(
  uid: string, 
  profile: Partial<FirebaseUserProfile>, 
  stats?: UserStats,
  bookmarks?: string[]
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const dataToSave: any = {
      ...profile,
      updatedAt: serverTimestamp()
    };
    if (stats) dataToSave.stats = stats;
    if (bookmarks) dataToSave.bookmarks = bookmarks;

    await setDoc(userRef, dataToSave, { merge: true });
  } catch (err) {
    console.warn('Firestore user save failed (offline or permissions):', err);
  }
}

export async function getUserFromFirestore(uid: string): Promise<{ stats?: UserStats; bookmarks?: string[]; profile?: FirebaseUserProfile } | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as any;
    }
  } catch (err) {
    console.warn('Firestore user fetch failed (offline fallback active):', err);
  }
  return null;
}

// -------------------------------------------------------------
// 2. Incidents Collection: incidents/{incidentId}
// -------------------------------------------------------------
export async function saveIncidentToFirestore(userId: string, incident: IncidentLog): Promise<void> {
  try {
    const incidentRef = doc(db, 'incidents', incident.id);
    await setDoc(incidentRef, {
      ...incident,
      userId,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore incident save failed (offline fallback active):', err);
  }
}

export async function fetchUserIncidentsFromFirestore(userId: string): Promise<IncidentLog[]> {
  try {
    const incidentsRef = collection(db, 'incidents');
    const q = query(incidentsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(20));
    const querySnapshot = await getDocs(q);
    const list: IncidentLog[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as IncidentLog);
    });
    return list;
  } catch (err) {
    console.warn('Firestore incidents fetch failed, using local storage:', err);
    return [];
  }
}

// -------------------------------------------------------------
// 3. Crowd Commander Sessions: emergency_sessions/{sessionId}
// -------------------------------------------------------------
export async function createSquadSessionInFirestore(session: EmergencySquadSession): Promise<void> {
  // 1. Save to local storage for immediate offline / zero-network resilience
  try {
    localStorage.setItem(`sanjeevani_squad_${session.id}`, JSON.stringify(session));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`sanjeevani_squad_${session.id}`);
      bc.postMessage(session);
      bc.close();
    }
  } catch (localErr) {
    console.warn('Local squad cache save failed:', localErr);
  }

  // 2. Persist to Firebase Firestore
  try {
    const sessionRef = doc(db, 'emergency_sessions', session.id);
    await setDoc(sessionRef, {
      ...session,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to save squad session in Firestore (using offline local engine):', err);
  }
}

export function subscribeToSquadSession(
  sessionId: string, 
  onUpdate: (session: EmergencySquadSession) => void
): () => void {
  // 1. Check local cache immediately for zero-latency load
  try {
    const cached = localStorage.getItem(`sanjeevani_squad_${sessionId}`);
    if (cached) {
      onUpdate(JSON.parse(cached));
    }
  } catch {
    // ignore
  }

  // 2. BroadcastChannel listener for tab/window sync
  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(`sanjeevani_squad_${sessionId}`);
      bc.onmessage = (event) => {
        if (event.data) {
          onUpdate(event.data as EmergencySquadSession);
        }
      };
    } catch {
      // ignore
    }
  }

  // 3. Storage event listener across browser tabs
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === `sanjeevani_squad_${sessionId}` && e.newValue) {
      try {
        onUpdate(JSON.parse(e.newValue));
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // 4. Firestore real-time listener
  let unsubFirestore = () => {};
  try {
    const sessionRef = doc(db, 'emergency_sessions', sessionId);
    unsubFirestore = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as EmergencySquadSession;
        // Update local cache
        try {
          localStorage.setItem(`sanjeevani_squad_${sessionId}`, JSON.stringify(data));
        } catch {}
        onUpdate(data);
      }
    });
  } catch (err) {
    console.warn('Failed to subscribe to squad session in Firestore:', err);
  }

  return () => {
    unsubFirestore();
    window.removeEventListener('storage', handleStorageEvent);
    if (bc) {
      bc.close();
    }
  };
}

export async function updateSquadRoleInFirestore(
  sessionId: string, 
  roleKey: string, 
  assignedTo: string,
  status: 'unassigned' | 'claimed' | 'in_progress' | 'completed' = 'claimed'
): Promise<void> {
  // Update local storage & broadcast
  try {
    const cached = localStorage.getItem(`sanjeevani_squad_${sessionId}`);
    if (cached) {
      const parsed: EmergencySquadSession = JSON.parse(cached);
      if (parsed.roles && parsed.roles[roleKey]) {
        parsed.roles[roleKey].assignedTo = assignedTo;
        parsed.roles[roleKey].status = status;
        parsed.roles[roleKey].assignedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (status === 'completed') {
          parsed.roles[roleKey].completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        parsed.updatedAt = new Date().toISOString();
        localStorage.setItem(`sanjeevani_squad_${sessionId}`, JSON.stringify(parsed));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel(`sanjeevani_squad_${sessionId}`);
          bc.postMessage(parsed);
          bc.close();
        }
      }
    }
  } catch {
    // ignore
  }

  // Update Firestore
  try {
    const sessionRef = doc(db, 'emergency_sessions', sessionId);
    const updates: any = {
      [`roles.${roleKey}.assignedTo`]: assignedTo,
      [`roles.${roleKey}.status`]: status,
      [`roles.${roleKey}.assignedAt`]: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: serverTimestamp()
    };
    if (status === 'completed') {
      updates[`roles.${roleKey}.completedAt`] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    await updateDoc(sessionRef, updates);
  } catch (err) {
    console.warn('Failed to update squad role in Firestore (local state updated):', err);
  }
}

export async function updateSquadRoleStatus(
  sessionId: string,
  roleKey: string,
  status: 'unassigned' | 'claimed' | 'in_progress' | 'completed'
): Promise<void> {
  try {
    const cached = localStorage.getItem(`sanjeevani_squad_${sessionId}`);
    if (cached) {
      const parsed: EmergencySquadSession = JSON.parse(cached);
      if (parsed.roles && parsed.roles[roleKey]) {
        parsed.roles[roleKey].status = status;
        if (status === 'completed') {
          parsed.roles[roleKey].completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        parsed.updatedAt = new Date().toISOString();
        localStorage.setItem(`sanjeevani_squad_${sessionId}`, JSON.stringify(parsed));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel(`sanjeevani_squad_${sessionId}`);
          bc.postMessage(parsed);
          bc.close();
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    const sessionRef = doc(db, 'emergency_sessions', sessionId);
    const updates: any = {
      [`roles.${roleKey}.status`]: status,
      updatedAt: serverTimestamp()
    };
    if (status === 'completed') {
      updates[`roles.${roleKey}.completedAt`] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    await updateDoc(sessionRef, updates);
  } catch (err) {
    console.warn('Failed to update role status in Firestore:', err);
  }
}

// -------------------------------------------------------------
// 4. Paramedic Handover Dockets: paramedic_dockets/{docketId}
// -------------------------------------------------------------
export async function saveParamedicDocketToFirestore(docket: ParamedicDocket): Promise<void> {
  try {
    const docketRef = doc(db, 'paramedic_dockets', docket.id);
    await setDoc(docketRef, {
      ...docket,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore paramedic docket save failed:', err);
  }
}

export async function getParamedicDocketFromFirestore(docketId: string): Promise<ParamedicDocket | null> {
  try {
    const docketRef = doc(db, 'paramedic_dockets', docketId);
    const snap = await getDoc(docketRef);
    if (snap.exists()) {
      return snap.data() as ParamedicDocket;
    }
  } catch (err) {
    console.warn('Failed to get paramedic docket from Firestore:', err);
  }
  return null;
}

export function subscribeToParamedicDocket(
  docketId: string,
  onUpdate: (docket: ParamedicDocket | null) => void
): () => void {
  try {
    const docketRef = doc(db, 'paramedic_dockets', docketId);
    const unsub = onSnapshot(docketRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as ParamedicDocket);
      } else {
        onUpdate(null);
      }
    }, (err) => {
      console.warn('Docket snapshot error:', err);
      onUpdate(null);
    });
    return unsub;
  } catch {
    return () => {};
  }
}

// -------------------------------------------------------------
// 5. Customer Reviews Collection: customer_reviews/{reviewId}
// -------------------------------------------------------------
export interface FirestoreCustomerReview {
  id: string;
  authorName: string;
  role: string;
  rating: number;
  categoryTag: string;
  badge: string;
  story: string;
  date: string;
  userId?: string | null;
  userEmail?: string | null;
  isUserSubmitted: boolean;
  platform?: string;
  verified?: boolean;
  createdAt?: any;
}

export async function saveCustomerReviewToFirestore(
  review: FirestoreCustomerReview
): Promise<void> {
  try {
    const reviewRef = doc(db, 'customer_reviews', review.id);
    const payload = {
      id: review.id,
      authorName: review.authorName,
      role: review.role,
      rating: review.rating,
      categoryTag: review.categoryTag,
      badge: review.badge,
      story: review.story,
      date: review.date,
      userId: review.userId || null,
      userEmail: review.userEmail || null,
      isUserSubmitted: true,
      platform: review.platform || 'web',
      verified: review.verified ?? true,
      createdAt: serverTimestamp()
    };
    await setDoc(reviewRef, payload);
    console.log('[Firestore] Customer review successfully saved:', review.id);
  } catch (err) {
    console.error('[Firestore] Error saving customer review:', err);
    throw err;
  }
}

export function subscribeToCustomerReviews(
  onUpdate: (reviews: FirestoreCustomerReview[]) => void
): () => void {
  try {
    const reviewsCol = collection(db, 'customer_reviews');
    const q = query(reviewsCol, orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched: FirestoreCustomerReview[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            authorName: data.authorName || 'Anonymous',
            role: data.role || 'Bystander',
            rating: typeof data.rating === 'number' ? data.rating : 5,
            categoryTag: data.categoryTag || 'General',
            badge: data.badge || 'Verified Bystander',
            story: data.story || '',
            date: data.date || 'Recent',
            userId: data.userId || null,
            userEmail: data.userEmail || null,
            isUserSubmitted: true,
            platform: data.platform || 'web',
            verified: data.verified ?? true,
            createdAt: data.createdAt
          });
        });
        onUpdate(fetched);
      },
      (err) => {
        console.warn('[Firestore] Error in customer_reviews snapshot listener with orderBy, falling back:', err);
        // Fallback query without orderBy
        const fallbackQuery = query(reviewsCol, limit(50));
        onSnapshot(
          fallbackQuery,
          (snap) => {
            const list: FirestoreCustomerReview[] = [];
            snap.forEach((d) => {
              const data = d.data();
              list.push({
                id: d.id,
                authorName: data.authorName || 'Anonymous',
                role: data.role || 'Bystander',
                rating: typeof data.rating === 'number' ? data.rating : 5,
                categoryTag: data.categoryTag || 'General',
                badge: data.badge || 'Verified Bystander',
                story: data.story || '',
                date: data.date || 'Recent',
                userId: data.userId || null,
                userEmail: data.userEmail || null,
                isUserSubmitted: true,
                platform: data.platform || 'web',
                verified: data.verified ?? true,
                createdAt: data.createdAt
              });
            });
            onUpdate(list);
          },
          (fallbackErr) => {
            console.warn('[Firestore] Fallback customer_reviews query also failed:', fallbackErr);
          }
        );
      }
    );
    return unsub;
  } catch (err) {
    console.warn('[Firestore] Could not initiate customer_reviews subscription:', err);
    return () => {};
  }
}

export async function getCustomerReviewsFromFirestore(): Promise<FirestoreCustomerReview[]> {
  try {
    const reviewsCol = collection(db, 'customer_reviews');
    const snap = await getDocs(query(reviewsCol, limit(50)));
    const list: FirestoreCustomerReview[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        authorName: data.authorName || 'Anonymous',
        role: data.role || 'Bystander',
        rating: typeof data.rating === 'number' ? data.rating : 5,
        categoryTag: data.categoryTag || 'General',
        badge: data.badge || 'Verified Bystander',
        story: data.story || '',
        date: data.date || 'Recent',
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        isUserSubmitted: true,
        platform: data.platform || 'web',
        verified: data.verified ?? true,
        createdAt: data.createdAt
      });
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] getCustomerReviewsFromFirestore failed:', err);
    return [];
  }
}
