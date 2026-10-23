// Types for Sanjeevani v2

export type Destination = 'home' | 'chat' | 'camera' | 'handoff' | 'practice' | 'library' | 'medicines' | 'mythbuster';

export type InjuryProtocolId = 
  | 'bleeding'
  | 'burn'
  | 'unconscious'
  | 'choking'
  | 'fracture'
  | 'custom';

export interface MicroStep {
  id: string;
  stepNumber: number;
  instruction: string;
  detail: string;
  actionPrompt: string;
  cameraRequired: boolean;
  arOverlayType?: 'pressure_point' | 'burn_cooling' | 'cpr_hands' | 'posture_check' | 'none';
  audioPrompt: string;
  durationSeconds?: number;
  isCPR?: boolean;
  metronomeBpm?: number;
  warningAlert?: string;
}

export interface FirstAidProtocol {
  id: InjuryProtocolId;
  title: string;
  shortDesc: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  requiresCamera: boolean;
  iconName: string;
  microSteps: MicroStep[];
  escalationTriggers: string[];
}

export interface IncidentLog {
  id: string;
  protocolId: InjuryProtocolId;
  protocolTitle: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  stepsCompleted: string[];
  escalationTriggered: boolean;
  escalationReason?: string;
  sensorObservations: string[];
}

export type LibraryCategory = 
  | 'All'
  | 'Bleeding & Wounds'
  | 'Burns'
  | 'Breathing & Airway'
  | 'Cardiac'
  | 'Trauma & Musculoskeletal'
  | 'Environmental'
  | 'Poisoning & Ingestion'
  | 'Allergic Reactions'
  | 'Neurological'
  | 'Metabolic / Diabetic'
  | 'Dental'
  | 'Pediatric-Specific';

export interface LibraryEntry {
  id: string;
  title: string;
  category: string;
  severityBadge: 'Mild' | 'Moderate' | 'Urgent' | 'Emergency';
  whatIsIt: string;
  steps: {
    icon: string;
    action: string;
    detail: string;
  }[];
  whatNotToDo: string[];
  whenToGetHelp: string[];
  quickReminder: string;
  linkedProtocolId: InjuryProtocolId;
  offlineReady?: boolean;
  bookmarked?: boolean;
}

export interface ScenarioQuiz {
  id: string;
  title: string;
  situation: string;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  principleLearned: string;
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  mythBuster?: string;
  isAiGenerated?: boolean;
}

export interface UserProgress {
  scenariosCompleted: string[];
  skillsLearned: string[];
  drillsCompleted: number;
  badgeLevel: 'First-Aid Beginner' | 'Safety Smart' | 'First-Aid Ready' | 'Emergency Aware';
  lastPracticedDate?: string;
}
