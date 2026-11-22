export type TestModuleId = 'ishihara-inspired' | 'red-green' | 'blue-yellow' | 'arrangement';

export type StimulusType = 'number' | 'shape' | 'letter' | 'path';

export type ResultClassification = 'A' | 'B' | 'C';

export interface ExperimentalPlate {
  id: string;
  module: Exclude<TestModuleId, 'arrangement'>;
  category: string;
  stimulusType: StimulusType;
  targetValue: string;
  promptText: string;
  options: string[];
  fgPalette: string[];
  bgPalette: string[];
  seed: number;
  isControl?: boolean;
  enabled: boolean;
  note?: string;
}

export interface QuestionResponse {
  questionId: string;
  category: string;
  stimulusType: string;
  expectedAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  isUnanswered: boolean;
  responseTimeMs: number;
}

export interface CategoryPerformance {
  category: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracyPercent: number;
}

export interface ArrangementComparison {
  levelId: string;
  levelTitle: string;
  referenceColors: string[];
  userColors: string[];
  errorScore: number;
  exactMatches: number;
}

export interface ScreeningResult {
  id: string;
  userId: string | null;
  testType: TestModuleId;
  testName: string;
  completedAtIso: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  scorePercentage: number;
  durationSeconds: number;
  resultLabel: ResultClassification;
  arrangementErrors?: number;
  arrangementDetails?: ArrangementComparison[];
  categoryBreakdown: CategoryPerformance[];
  responses: QuestionResponse[];
  isGuest: boolean;
}

export interface EducationalArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  reference: string;
  order: number;
  published: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  disclaimerNotice: string;
  enabledTests: Record<TestModuleId, boolean>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAtIso?: string;
}

export interface AnonymousStat {
  id: string;
  testType: TestModuleId;
  scorePercentage: number;
  resultLabel: ResultClassification;
  durationSeconds: number;
  createdAtIso: string;
}
