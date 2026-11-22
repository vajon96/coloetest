import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Circle,
  Diamond,
  HelpCircle,
  Hexagon,
  Info,
  Plus,
  Square,
  Triangle,
} from 'lucide-react';
import {
  computePlateScreeningResult,
  formatDuration,
  getTestDisplayName,
  randomizePlateOrderAndOptions,
} from '../lib/testEngine';
import { ExperimentalPlate, QuestionResponse, ScreeningResult, TestModuleId } from '../types/vision';
import { PseudoisochromaticPlate } from './PseudoisochromaticPlate';

interface PlateTestRunnerProps {
  testType: Exclude<TestModuleId, 'arrangement'>;
  allPlates: ExperimentalPlate[];
  userId: string | null;
  onComplete: (result: ScreeningResult) => void;
  onExit: () => void;
  onReviewInstructions: () => void;
}

function renderShapeGlyph(option: string): React.ReactNode {
  const lower = option.toLowerCase();
  if (lower === 'circle') return <Circle className="w-4 h-4 shrink-0" aria-hidden="true" />;
  if (lower === 'triangle') return <Triangle className="w-4 h-4 shrink-0" aria-hidden="true" />;
  if (lower === 'square') return <Square className="w-4 h-4 shrink-0" aria-hidden="true" />;
  if (lower === 'diamond') return <Diamond className="w-4 h-4 shrink-0" aria-hidden="true" />;
  if (lower === 'hexagon') return <Hexagon className="w-4 h-4 shrink-0" aria-hidden="true" />;
  if (lower === 'plus') return <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />;
  return null;
}

export const PlateTestRunner: React.FC<PlateTestRunnerProps> = ({
  testType,
  allPlates,
  userId,
  onComplete,
  onExit,
  onReviewInstructions,
}) => {
  const sessionPlates = useMemo(() => {
    const filtered = allPlates.filter((p) => p.module === testType && p.enabled);
    return randomizePlateOrderAndOptions(filtered);
  }, [allPlates, testType]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const plateStartRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    plateStartRef.current = Date.now();
  }, [currentIndex]);

  const currentPlate = sessionPlates[currentIndex];

  const handleSelectAnswer = (selectedOption: string | null) => {
    if (isSubmitting || !currentPlate) return;
    setIsSubmitting(true);

    const responseTimeMs = Math.max(100, Date.now() - plateStartRef.current);
    const isUnanswered = selectedOption === null;
    const isCorrect =
      !isUnanswered &&
      selectedOption.trim().toLowerCase() === currentPlate.targetValue.trim().toLowerCase();

    const entry: QuestionResponse = {
      questionId: currentPlate.id,
      category: currentPlate.category,
      stimulusType: currentPlate.stimulusType,
      expectedAnswer: currentPlate.targetValue,
      userAnswer: selectedOption,
      isCorrect,
      isUnanswered,
      responseTimeMs,
    };

    const nextResponses = [...responses, entry];

    window.setTimeout(() => {
      if (currentIndex + 1 >= sessionPlates.length) {
        const totalDuration = Math.max(
          1,
          Math.round((Date.now() - sessionStartRef.current) / 1000)
        );
        const result = computePlateScreeningResult({
          testType,
          plates: sessionPlates,
          responses: nextResponses,
          durationSeconds: totalDuration,
          userId,
        });
        onComplete(result);
      } else {
        setResponses(nextResponses);
        setCurrentIndex((prev) => prev + 1);
        setIsSubmitting(false);
      }
    }, 160);
  };

  if (sessionPlates.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Active Plates Available</h2>
          <p className="text-sm text-slate-600 mb-6">
            This screening module currently has no enabled experimental plates.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / sessionPlates.length) * 100);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Runner Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Exit Screening
        </button>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
          <button
            type="button"
            onClick={onReviewInstructions}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-blue-700 hover:underline"
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            Review Instructions
          </button>
          <span aria-hidden="true">·</span>
          <span>
            Plate {currentIndex + 1} / {sessionPlates.length}
          </span>
          <span aria-hidden="true">·</span>
          <span>Elapsed: {formatDuration(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-blue-700 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Screening progress"
        />
      </div>

      {/* Scientific Context Banner */}
      <div className="mb-6 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="font-semibold text-slate-900">{getTestDisplayName(testType)}</strong>
          {' · '}
          {testType === 'ishihara-inspired' &&
            'Original Ishihara-inspired experimental plates (not copyrighted clinical plates).'}
          {testType === 'red-green' &&
            'Explores protan- and deutan-axis discrimination without claiming clinical subtype diagnosis.'}
          {testType === 'blue-yellow' &&
            'Experimental blue-yellow educational exercise — not clinically validated.'}
        </span>
        <span className="font-mono text-slate-500">{currentPlate.category}</span>
      </div>

      {/* Main Split Stage */}
      <div className="bg-white hc-surface border border-slate-200 rounded-xl p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <PseudoisochromaticPlate plate={currentPlate} size={320} />
          <p className="text-xs font-mono text-slate-500 mt-4">
            Stimulus type: {currentPlate.stimulusType} · Plate ID: {currentPlate.id}
          </p>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
            Question {currentIndex + 1} of {sessionPlates.length}
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">
            {currentPlate.promptText}
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Select the option that matches what you perceive inside the circle, or choose{' '}
            <span className="font-medium text-slate-800">Don&apos;t Know / Cannot See</span> if no
            figure is visible.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {currentPlate.options.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectAnswer(opt)}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-600 text-slate-900 font-semibold text-base transition-colors disabled:opacity-50 min-h-[48px]"
              >
                {renderShapeGlyph(opt)}
                <span>{opt}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSelectAnswer(null)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            Don&apos;t Know / Cannot See
          </button>
        </div>
      </div>
    </section>
  );
};
