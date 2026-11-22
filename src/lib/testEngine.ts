import {
  ArrangementComparison,
  CategoryPerformance,
  ExperimentalPlate,
  QuestionResponse,
  ResultClassification,
  ScreeningResult,
  TestModuleId,
} from '../types/vision';

/**
 * Deterministic seeded PRNG (Mulberry32) for consistent plate synthesis & controlled shuffles.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle returning a new array without mutating question answer references.
 */
export function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Randomize plate options while preserving target answer integrity.
 */
export function randomizePlateOrderAndOptions(plates: ExperimentalPlate[]): ExperimentalPlate[] {
  const controlPlates = plates.filter((p) => p.isControl);
  const testPlates = shuffleItems(plates.filter((p) => !p.isControl));
  const ordered = [...controlPlates, ...testPlates];
  return ordered.map((plate) => ({
    ...plate,
    options: shuffleItems(plate.options),
  }));
}

export function getTestDisplayName(testType: TestModuleId): string {
  switch (testType) {
    case 'ishihara-inspired':
      return 'Ishihara-Inspired Color Plate Screening';
    case 'red-green':
      return 'Red-Green Color Vision Screening';
    case 'blue-yellow':
      return 'Blue-Yellow Color Vision Screening (Experimental)';
    case 'arrangement':
      return 'Hue Sequence Color Arrangement Exercise';
  }
}

export function classifyScreeningOutcome(
  responses: QuestionResponse[],
  plates: ExperimentalPlate[]
): ResultClassification {
  const total = responses.length;
  if (total === 0) return 'C';

  const controlIds = new Set(plates.filter((p) => p.isControl).map((p) => p.id));
  const missedControl = responses.some((r) => controlIds.has(r.questionId) && !r.isCorrect);
  if (missedControl) {
    return 'C';
  }

  const unansweredRatio = responses.filter((r) => r.isUnanswered).length / total;
  const nonControl = responses.filter((r) => !controlIds.has(r.questionId));
  const nonControlPool = nonControl.length > 0 ? nonControl : responses;
  const nonControlCorrectRatio =
    nonControlPool.filter((r) => r.isCorrect).length / nonControlPool.length;

  // Excessive skipped items or ambiguous borderline accuracy triggers Inconclusive (C)
  if (unansweredRatio >= 0.6 && nonControlCorrectRatio < 0.5) {
    return 'C';
  }
  if (nonControlCorrectRatio >= 0.8) {
    return 'A';
  }
  if (nonControlCorrectRatio >= 0.5 && unansweredRatio >= 0.35) {
    return 'C';
  }
  return 'B';
}

export function computePlateScreeningResult(params: {
  testType: Exclude<TestModuleId, 'arrangement'>;
  plates: ExperimentalPlate[];
  responses: QuestionResponse[];
  durationSeconds: number;
  userId: string | null;
}): ScreeningResult {
  const { testType, plates, responses, durationSeconds, userId } = params;
  const totalQuestions = responses.length;
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const unansweredCount = responses.filter((r) => r.isUnanswered).length;
  const incorrectCount = responses.filter((r) => !r.isCorrect && !r.isUnanswered).length;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;

  const categoryMap = new Map<string, QuestionResponse[]>();
  for (const r of responses) {
    const arr = categoryMap.get(r.category) ?? [];
    arr.push(r);
    categoryMap.set(r.category, arr);
  }

  const categoryBreakdown: CategoryPerformance[] = Array.from(categoryMap.entries()).map(
    ([category, items]) => {
      const catCorrect = items.filter((i) => i.isCorrect).length;
      const catUnanswered = items.filter((i) => i.isUnanswered).length;
      const catIncorrect = items.filter((i) => !i.isCorrect && !i.isUnanswered).length;
      return {
        category,
        total: items.length,
        correct: catCorrect,
        incorrect: catIncorrect,
        unanswered: catUnanswered,
        accuracyPercent: items.length > 0 ? Math.round((catCorrect / items.length) * 100) : 0,
      };
    }
  );

  const resultLabel = classifyScreeningOutcome(responses, plates);

  return {
    id: `scr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    testType,
    testName: getTestDisplayName(testType),
    completedAtIso: new Date().toISOString(),
    totalQuestions,
    correctCount,
    incorrectCount,
    unansweredCount,
    scorePercentage,
    durationSeconds: Math.max(1, Math.round(durationSeconds)),
    resultLabel,
    categoryBreakdown,
    responses,
    isGuest: !userId,
  };
}

/**
 * Compute displacement error score for an arrangement sequence against its reference sequence.
 */
export function evaluateArrangementSequence(
  referenceColors: string[],
  userColors: string[]
): { errorScore: number; exactMatches: number } {
  let errorScore = 0;
  let exactMatches = 0;
  for (let i = 0; i < userColors.length; i++) {
    const targetIdx = referenceColors.indexOf(userColors[i]);
    if (targetIdx === i) {
      exactMatches += 1;
    } else if (targetIdx >= 0) {
      errorScore += Math.abs(targetIdx - i);
    }
  }
  return { errorScore, exactMatches };
}

export function computeArrangementScreeningResult(params: {
  comparisons: ArrangementComparison[];
  durationSeconds: number;
  userId: string | null;
}): ScreeningResult {
  const { comparisons, durationSeconds, userId } = params;
  const totalTiles = comparisons.reduce((acc, c) => acc + c.referenceColors.length, 0);
  const exactMatches = comparisons.reduce((acc, c) => acc + c.exactMatches, 0);
  const totalErrors = comparisons.reduce((acc, c) => acc + c.errorScore, 0);
  const incorrectCount = totalTiles - exactMatches;
  const scorePercentage =
    totalTiles > 0 ? Math.round((exactMatches / totalTiles) * 1000) / 10 : 0;

  let resultLabel: ResultClassification = 'A';
  if (totalErrors > 10 || scorePercentage < 50) {
    resultLabel = 'B';
  } else if (totalErrors > 4 && scorePercentage < 75) {
    resultLabel = 'C';
  }

  const categoryBreakdown: CategoryPerformance[] = comparisons.map((c) => {
    const total = c.referenceColors.length;
    const incorrect = total - c.exactMatches;
    return {
      category: c.levelTitle,
      total,
      correct: c.exactMatches,
      incorrect,
      unanswered: 0,
      accuracyPercent: total > 0 ? Math.round((c.exactMatches / total) * 100) : 0,
    };
  });

  const responses: QuestionResponse[] = comparisons.map((c, idx) => ({
    questionId: c.levelId || `arr_${idx + 1}`,
    category: c.levelTitle,
    stimulusType: 'hue-arrangement',
    expectedAnswer: `${c.referenceColors.length} ordered tiles`,
    userAnswer: `${c.exactMatches}/${c.referenceColors.length} exact (error index: ${c.errorScore})`,
    isCorrect: c.errorScore <= 2,
    isUnanswered: false,
    responseTimeMs: Math.round((durationSeconds * 1000) / Math.max(1, comparisons.length)),
  }));

  return {
    id: `scr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    testType: 'arrangement',
    testName: getTestDisplayName('arrangement'),
    completedAtIso: new Date().toISOString(),
    totalQuestions: totalTiles,
    correctCount: exactMatches,
    incorrectCount,
    unansweredCount: 0,
    scorePercentage,
    durationSeconds: Math.max(1, Math.round(durationSeconds)),
    resultLabel,
    arrangementErrors: totalErrors,
    arrangementDetails: comparisons,
    categoryBreakdown,
    responses,
    isGuest: !userId,
  };
}

export function getResultLabelDetails(label: ResultClassification): {
  headline: string;
  badgeText: string;
  explanation: string;
  toneClass: string;
} {
  switch (label) {
    case 'A':
      return {
        headline: 'No apparent difficulty detected in this screening.',
        badgeText: '● Screening Outcome A',
        explanation:
          'Your responses aligned closely with the reference targets on this display. Please note that a screening without apparent difficulty does not rule out every type of color vision deficiency, as uncalibrated screens can introduce subtle contrast cues.',
        toneClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    case 'B':
      return {
        headline: 'Some color discrimination difficulties observed.',
        badgeText: '▲ Screening Outcome B',
        explanation:
          'Several chromatic plates or hue sequences showed missed or shifted responses. Display calibration and ambient lighting can influence online outcomes; consider scheduling a standardized clinical color vision test with an optometrist or ophthalmologist.',
        toneClass: 'text-amber-800 bg-amber-50 border-amber-200',
      };
    case 'C':
      return {
        headline: 'Inconclusive result — further examination recommended.',
        badgeText: '◆ Screening Outcome C',
        explanation:
          'Response patterns were mixed, incomplete, or included missed baseline control items. We recommend verifying your display settings (disabling Night Shift / True Tone) and consulting a qualified eye care professional for definitive clinical evaluation.',
        toneClass: 'text-slate-800 bg-slate-100 border-slate-300',
      };
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}
