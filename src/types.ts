export interface Skill {
  id: number;
  name: string;
  leverage?: string;
}

export interface Conversation {
  id: number;
  date: string;
  notes: string;
}

export interface Transcription {
  id: number;
  date: string;
  tag: string;
  content: string;
  summary?: string;
}

export interface AIChatLink {
  id: number;
  title: string;
  url: string;
  date: string;
}

export interface MaintenanceLog {
  id: number;
  date: string;
  type: 'whatsapp' | 'call' | 'message' | 'in-person' | 'email' | 'other';
  notes: string;
  nextFollowUpDate?: string;
  nextFollowUpNotes?: string;
  screenshotUrl?: string;
}

export interface Contact {
  id: number;
  name: string;
  title: string;
  avatar?: string;
  socials?: {
    whatsapp?: string;
    linkedin?: string;
  };
  whatsAppUrl?: string; // Direct WhatsApp communication link
  aiChatLinks?: AIChatLink[]; // Links to saved AI chats about this person
  source?: string;
  eventId?: number;
  tags?: string[];
  skills?: Skill[];
  projects?: string[];
  problems?: string[];
  desires?: string[];
  commonalities?: string[];
  valueIGive?: string;
  valueTheyGive?: string;
  thingsToMention?: string[];
  questionsToAsk?: string[];
  whoTheyKnow?: string[];
  conversations?: Conversation[];
  transcriptions?: Transcription[];
  categories?: string[];
  customGroupings?: Record<string, string[]>;
  lastMaintainedDate?: string;
  nextFollowUpDate?: string;
  followUpReminderNotes?: string;
  maintenanceCadenceDays?: number;
  maintenanceLogs?: MaintenanceLog[];
}

export interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  gpsLink?: string;
  photo?: string;
  category?: string;
  projects?: string[];
  goals?: string;
  targetAudience?: string;
  specificPeople?: string[];
  status: 'past' | 'upcoming' | string;
  isHighPriority?: boolean;
}

export interface StrategyLink {
  id: number;
  person: string;
  role: string;
  description?: string;
  whyNeeded?: string;
  attachments?: string[];
  linkedContactId?: number;
  additionalAnswers?: string[];
}

export interface Strategy {
  id: number;
  goal: string;
  target: string;
  chain: StrategyLink[];
  status: string;
  isHighPriority?: boolean;
}

export interface CustomFolders {
  events: string[];
  skills: string[];
  tags: string[];
  network: string[];
  projects: string[];
  categories: string[];
}

export interface LifeGoal {
  id: number;
  goal: string;
  category?: string;
  targetDate?: string;
  linkedContactIds: number[]; // Existing contacts who can help
  status: 'active' | 'achieved' | string;
}

export interface WhatIDoCard {
  id: string; // unique identifier
  context: string; // context name (e.g., Professional, Hobbies, etc.)
  answer: string; // tailored version of "What do you do?"
}

export interface GrowthAreaLink {
  contactId: number;
  type: 'help' | 'delegate';
}

export interface GrowthArea {
  name: string;
  links?: GrowthAreaLink[];
}

export interface CustomSocialCard {
  id: string;
  platform: string;
  url: string;
}

export interface UserProfile {
  name: string;
  title: string;
  bio?: string;
  avatar?: string;
  valueToGive: string[]; // Value I can give to others
  strengths: string[]; // My strengths
  growthAreas: (string | GrowthArea)[]; // Areas I'd like to find network to delegate/leverage
  lifeGoals: LifeGoal[]; // My life goals
  whatIDoCards?: WhatIDoCard[]; // Categorized "What do you do?" context cards
  pitchRefiningPrompt?: string; // Saved AI prompt to optimize pitch
  socialCards?: CustomSocialCard[]; // Custom social media card holders
}

export type ActiveTab = 'contacts' | 'events' | 'strategy' | 'visualizer' | 'profile';

export interface ViewState {
  view: 'list' | 'detail' | 'create';
  id: number | null;
}
