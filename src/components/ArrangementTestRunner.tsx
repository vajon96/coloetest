import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GripVertical,
  Info,
  RotateCcw,
} from 'lucide-react';
import { ARRANGEMENT_LEVELS, ArrangementLevel } from '../data/arrangementLevels';
import { BN_ARRANGEMENT_LEVELS, Language } from '../i18n/translations';
import {
  computeArrangementScreeningResult,
  evaluateArrangementSequence,
  formatDuration,
  shuffleItems,
} from '../lib/testEngine';
import { ArrangementComparison, ScreeningResult } from '../types/vision';

interface ArrangementTestRunnerProps {
  lang: Language;
  userId: string | null;
  onComplete: (result: ScreeningResult) => void;
  onExit: () => void;
  onReviewInstructions: () => void;
}

function createShuffledLevelColors(level: ArrangementLevel): string[] {
  let shuffled = shuffleItems(level.referenceSequence);
  let guard = 0;
  while (shuffled.every((c, idx) => c === level.referenceSequence[idx]) && guard < 10) {
    shuffled = shuffleItems(level.referenceSequence);
    guard += 1;
  }
  return shuffled;
}

export const ArrangementTestRunner: React.FC<ArrangementTestRunnerProps> = ({
  lang,
  userId,
  onComplete,
  onExit,
  onReviewInstructions,
}) => {
  const isBn = lang === 'bn';
  const [selectedDifficultyIndex, setSelectedDifficultyIndex] = useState<number>(0);
  const [tiles, setTiles] = useState<string[]>(() =>
    createShuffledLevelColors(ARRANGEMENT_LEVELS[0])
  );
  const [selectedTileIdx, setSelectedTileIdx] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [completedLevels, setCompletedLevels] = useState<ArrangementComparison[]>([]);
  const [levelPreviewComparison, setLevelPreviewComparison] =
    useState<ArrangementComparison | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionStartRef = useRef<number>(Date.now());
  const currentLevel = ARRANGEMENT_LEVELS[selectedDifficultyIndex];
  const bnLevel = BN_ARRANGEMENT_LEVELS[currentLevel.id];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const swapTiles = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= tiles.length ||
      toIdx >= tiles.length ||
      fromIdx === toIdx
    ) {
      return;
    }
    const next = [...tiles];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setTiles(next);
    setSelectedTileIdx(toIdx);
    setAnnouncement(
      isBn
        ? `টাইলস অবস্থান ${fromIdx + 1} থেকে ${toIdx + 1}-এ সরানো হয়েছে।`
        : `Moved tile from position ${fromIdx + 1} to position ${toIdx + 1}.`
    );
  };

  const handleTileClick = (idx: number) => {
    if (levelPreviewComparison) return;
    if (selectedTileIdx === null) {
      setSelectedTileIdx(idx);
      setAnnouncement(
        isBn
          ? `অবস্থান ${idx + 1} নির্বাচিত হয়েছে। অদলবদল করতে আরেকটি টাইলস বা তীর বাটন ব্যবহার করুন।`
          : `Selected tile at position ${idx + 1}. Choose another tile or use Left/Right buttons to move.`
      );
      return;
    }
    if (selectedTileIdx === idx) {
      setSelectedTileIdx(null);
      return;
    }
    const next = [...tiles];
    const temp = next[selectedTileIdx];
    next[selectedTileIdx] = next[idx];
    next[idx] = temp;
    setTiles(next);
    setAnnouncement(
      isBn
        ? `অবস্থান ${selectedTileIdx + 1} এবং ${idx + 1} অদলবদল করা হয়েছে।`
        : `Swapped position ${selectedTileIdx + 1} with position ${idx + 1}.`
    );
    setSelectedTileIdx(null);
  };

  const handleTileKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (levelPreviewComparison) return;
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      swapTiles(idx, idx - 1);
    } else if (e.key === 'ArrowRight' && idx < tiles.length - 1) {
      e.preventDefault();
      swapTiles(idx, idx + 1);
    }
  };

  const handleSubmitLevel = () => {
    if (isSubmitting || levelPreviewComparison) return;
    setIsSubmitting(true);

    const { errorScore, exactMatches } = evaluateArrangementSequence(
      currentLevel.referenceSequence,
      tiles
    );

    const comparison: ArrangementComparison = {
      levelId: currentLevel.id,
      levelTitle: isBn && bnLevel ? bnLevel.title : currentLevel.title,
      referenceColors: [...currentLevel.referenceSequence],
      userColors: [...tiles],
      errorScore,
      exactMatches,
    };

    setLevelPreviewComparison(comparison);
    setCompletedLevels((prev) => [...prev, comparison]);
    setSelectedTileIdx(null);
    setIsSubmitting(false);
  };

  const handleNextOrFinish = () => {
    if (selectedDifficultyIndex + 1 < ARRANGEMENT_LEVELS.length) {
      const nextIdx = selectedDifficultyIndex + 1;
      setSelectedDifficultyIndex(nextIdx);
      setTiles(createShuffledLevelColors(ARRANGEMENT_LEVELS[nextIdx]));
      setLevelPreviewComparison(null);
      setSelectedTileIdx(null);
    } else {
      const totalDuration = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 1000));
      const result = computeArrangementScreeningResult({
        comparisons: completedLevels,
        durationSeconds: totalDuration,
        userId,
      });
      onComplete(result);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {isBn ? 'স্ক্রিনিং থেকে বের হন' : 'Exit Screening'}
        </button>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
          <button
            type="button"
            onClick={onReviewInstructions}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-blue-700 hover:underline"
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            {isBn ? 'নির্দেশনা দেখুন' : 'Review Instructions'}
          </button>
          <span aria-hidden="true">·</span>
          <span>
            {isBn ? 'ধাপ' : 'Stage'} {selectedDifficultyIndex + 1} / {ARRANGEMENT_LEVELS.length}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {isBn ? 'সময়:' : 'Elapsed:'} {formatDuration(elapsedSeconds, lang)}
          </span>
        </div>
      </div>

      {/* Scientific Context Banner */}
      <div className="mb-6 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700">
        <strong className="font-semibold text-slate-900">
          {isBn
            ? 'ইন্টারঅ্যাক্টিভ রঙের ক্রম সাজানোর অনুশীলন'
            : 'Interactive Hue Sequence Arrangement Exercise'}
        </strong>
        {' · '}
        {isBn
          ? '৩টি কঠিনতার স্তরে শিক্ষামূলক রঙ সাজানোর পরীক্ষা। এটি অনুমোদিত Farnsworth-Munsell 100 Hue টেস্ট নয়।'
          : 'Educational gradient ordering task across 3 difficulty tiers. This is NOT a certified Farnsworth-Munsell 100 Hue Test or standardized Munsell cap instrument.'}
      </div>

      <div className="bg-white hc-surface border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-1">
              {isBn ? 'কঠিনতার স্তর:' : 'Difficulty:'}{' '}
              {isBn && bnLevel ? bnLevel.difficulty : currentLevel.difficulty}
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isBn && bnLevel ? bnLevel.title : currentLevel.title}
            </h2>
            <p className="text-sm text-slate-600">
              {isBn && bnLevel ? bnLevel.description : currentLevel.description}
            </p>
          </div>
          {!levelPreviewComparison && (
            <button
              type="button"
              onClick={() => {
                setTiles(createShuffledLevelColors(currentLevel));
                setSelectedTileIdx(null);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              {isBn ? 'পুনরায় এলোমেলো করুন' : 'Reshuffle Tiles'}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 mb-5 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
          <strong>{isBn ? 'কীভাবে সাজাবেন:' : 'How to arrange:'}</strong>{' '}
          {isBn
            ? 'দুটি স্থির প্রান্তের মাঝে টাইলসগুলো ড্র্যাগ করে বসান, অথবা দুটি টাইলসে ক্লিক করে স্থান বদল করুন, কিংবা টাইলস নির্বাচন করে কিবোর্ডের ← / → বাটন ব্যবহার করুন।'
            : 'Drag and drop tiles between the fixed Start and End anchors, click two tiles to swap them, or select a tile and use the ← / → arrow keys or move buttons below.'}
        </p>

        {/* Tile Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-6 px-3 bg-slate-50 border border-slate-200 rounded-xl mb-6">
          {/* Start Anchor */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg border-2 border-slate-900 flex items-end justify-center p-1"
              style={{ backgroundColor: currentLevel.startAnchor.color }}
              title={isBn && bnLevel ? bnLevel.startLabel : currentLevel.startAnchor.label}
            >
              <span className="text-[10px] font-mono font-semibold bg-white/90 text-slate-900 px-1 rounded">
                {isBn ? 'শুরু' : 'Start'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 mt-1.5">
              {isBn ? 'স্থির' : 'Fixed'}
            </span>
          </div>

          {/* Movable Tiles */}
          {tiles.map((color, idx) => {
            const isSelected = selectedTileIdx === idx;
            return (
              <div key={`${color}-${idx}`} className="flex flex-col items-center">
                <button
                  type="button"
                  draggable={!levelPreviewComparison}
                  onDragStart={() => setDraggedIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIdx !== null && !levelPreviewComparison) {
                      swapTiles(draggedIdx, idx);
                    }
                    setDraggedIdx(null);
                  }}
                  onClick={() => handleTileClick(idx)}
                  onKeyDown={(e) => handleTileKeyDown(e, idx)}
                  aria-label={
                    isBn
                      ? `অবস্থান ${idx + 1}-এ চলমান রঙের টাইলস। ${
                          isSelected ? 'নির্বাচিত।' : 'নির্বাচন করতে Enter বা সরাতে তীর কী চাপুন।'
                        }`
                      : `Movable color tile at position ${idx + 1}. ${
                          isSelected
                            ? 'Selected.'
                            : 'Press Enter to select or use Left/Right arrows to move.'
                        }`
                  }
                  className={`w-12 h-16 sm:w-14 sm:h-20 rounded-lg flex items-start justify-end p-1 transition-transform cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'ring-2 ring-blue-700 ring-offset-2 scale-105'
                      : 'border border-slate-300 hover:scale-[1.03]'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <GripVertical
                    className="w-3.5 h-3.5 text-white/80 drop-shadow"
                    aria-hidden="true"
                  />
                </button>
                <span className="text-[11px] font-mono tabular-nums text-slate-600 mt-1.5">
                  #{idx + 1}
                </span>
              </div>
            );
          })}

          {/* End Anchor */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg border-2 border-slate-900 flex items-end justify-center p-1"
              style={{ backgroundColor: currentLevel.endAnchor.color }}
              title={isBn && bnLevel ? bnLevel.endLabel : currentLevel.endAnchor.label}
            >
              <span className="text-[10px] font-mono font-semibold bg-white/90 text-slate-900 px-1 rounded">
                {isBn ? 'শেষ' : 'End'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 mt-1.5">
              {isBn ? 'স্থির' : 'Fixed'}
            </span>
          </div>
        </div>

        {/* Accessible Keyboard Move Bar */}
        {!levelPreviewComparison && selectedTileIdx !== null && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-xs font-mono text-slate-600">
              {isBn ? `নির্বাচিত অবস্থান #${selectedTileIdx + 1}:` : `Selected Position #${selectedTileIdx + 1}:`}
            </span>
            <button
              type="button"
              disabled={selectedTileIdx === 0}
              onClick={() => swapTiles(selectedTileIdx, selectedTileIdx - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              {isBn ? 'বামে সরান' : 'Move Left'}
            </button>
            <button
              type="button"
              disabled={selectedTileIdx === tiles.length - 1}
              onClick={() => swapTiles(selectedTileIdx, selectedTileIdx + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            >
              {isBn ? 'ডানে সরান' : 'Move Right'}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="sr-only" aria-live="polite">
          {announcement}
        </div>

        {levelPreviewComparison ? (
          <div className="border-t border-slate-200 pt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" aria-hidden="true" />
                  {isBn
                    ? `ধাপ মূল্যায়িত: ${levelPreviewComparison.exactMatches} / ${levelPreviewComparison.referenceColors.length}টি সঠিক অবস্থান`
                    : `Stage Evaluated: ${levelPreviewComparison.exactMatches} / ${levelPreviewComparison.referenceColors.length} Exact Matches`}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {isBn ? 'বিচ্যুতি ত্রুটি স্কোর:' : 'Displacement error score:'}{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {levelPreviewComparison.errorScore}
                  </span>{' '}
                  {isBn
                    ? '(০ মানে রেফারেন্স ক্রমের সাথে হুবহু মিল)।'
                    : '(0 indicates exact alignment with the reference sequence).'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleNextOrFinish}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                {selectedDifficultyIndex + 1 < ARRANGEMENT_LEVELS.length
                  ? isBn
                    ? 'পরবর্তী স্তরে যান'
                    : 'Continue to Next Level'
                  : isBn
                  ? 'পূর্ণাঙ্গ ফলাফল দেখুন'
                  : 'View Complete Screening Results'}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-mono uppercase text-slate-500 mb-2">
                  {isBn ? 'আপনার সাজানো ক্রম' : 'Your Sequence'}
                </p>
                <div className="flex gap-1.5">
                  {levelPreviewComparison.userColors.map((hex, i) => (
                    <div
                      key={`${hex}-u-${i}`}
                      className="flex-1 h-9 rounded border border-slate-300"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-mono uppercase text-slate-500 mb-2">
                  {isBn ? 'সঠিক রেফারেন্স ক্রম' : 'Reference Hue Sequence'}
                </p>
                <div className="flex gap-1.5">
                  {levelPreviewComparison.referenceColors.map((hex, i) => (
                    <div
                      key={`${hex}-r-${i}`}
                      className="flex-1 h-9 rounded border border-slate-300"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-200 pt-6 flex justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitLevel}
              className="px-6 py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {isBn ? 'রঙের ক্রম জমা দিন' : 'Submit Hue Arrangement'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
