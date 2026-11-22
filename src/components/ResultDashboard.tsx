import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeft, Download, RotateCcw, ShieldAlert, Stethoscope } from 'lucide-react';
import { generateScreeningPdfReport } from '../lib/pdfGenerator';
import { formatDuration, getResultLabelDetails } from '../lib/testEngine';
import { ScreeningResult, TestModuleId } from '../types/vision';

interface ResultDashboardProps {
  result: ScreeningResult;
  participantLabel: string;
  onRetakeTest: (testType: TestModuleId) => void;
  onBackToHome: () => void;
  onGoToDashboard: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  result,
  participantLabel,
  onRetakeTest,
  onBackToHome,
  onGoToDashboard,
}) => {
  const outcome = getResultLabelDetails(result.resultLabel);

  const chartData = result.categoryBreakdown.map((item) => ({
    name: item.category.length > 22 ? `${item.category.slice(0, 20)}...` : item.category,
    fullName: item.category,
    Accuracy: item.accuracyPercent,
    Correct: item.correct,
    Total: item.total,
  }));

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Home
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onRetakeTest(result.testType)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Retake Test
          </button>
          <button
            type="button"
            onClick={() => generateScreeningPdfReport(result, participantLabel)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Main Summary Card */}
      <div className="bg-white hc-surface border border-slate-200 rounded-xl p-6 sm:p-10 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
              Screening Result Summary
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{result.testName}</h1>
            <p className="text-xs font-mono text-slate-500 mt-2">
              Completed: {new Date(result.completedAtIso).toLocaleString()} · Mode:{' '}
              {result.isGuest ? 'Guest Session' : 'Saved to Account'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-mono uppercase text-slate-500">
              Experimental Screening Score
            </p>
            <p className="text-3xl font-mono font-bold tabular-nums text-slate-900">
              {result.scorePercentage}%
            </p>
          </div>
        </div>

        {/* Outcome Classification Banner */}
        <div className={`p-5 rounded-lg border mb-8 ${outcome.toneClass}`}>
          <p className="text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            {outcome.badgeText}
          </p>
          <h2 className="text-lg font-bold mb-2">{outcome.headline}</h2>
          <p className="text-sm leading-relaxed">{outcome.explanation}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-mono text-slate-500">Questions / Tiles</p>
            <p className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1">
              {result.totalQuestions}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-mono text-slate-500">Correct</p>
            <p className="text-2xl font-mono font-bold tabular-nums text-emerald-700 mt-1">
              {result.correctCount}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-mono text-slate-500">Incorrect</p>
            <p className="text-2xl font-mono font-bold tabular-nums text-amber-700 mt-1">
              {result.incorrectCount}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-mono text-slate-500">Unanswered</p>
            <p className="text-2xl font-mono font-bold tabular-nums text-slate-700 mt-1">
              {result.unansweredCount}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
            <p className="text-xs font-mono text-slate-500">Time Taken</p>
            <p className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1">
              {formatDuration(result.durationSeconds)}
            </p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Category Performance Breakdown
          </h3>
          <div className="h-64 w-full bg-slate-50 border border-slate-200 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, 'Accuracy']}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? 'Category'
                  }
                />
                <Bar dataKey="Accuracy" fill="#1D4ED8" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Arrangement Reference Sequences (if applicable) */}
        {result.arrangementDetails && result.arrangementDetails.length > 0 && (
          <div className="mb-8 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Hue Sequence Arrangement Comparison (Total Error Index: {result.arrangementErrors ?? 0})
            </h3>
            {result.arrangementDetails.map((comp) => (
              <div
                key={comp.levelId}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex flex-wrap justify-between text-xs font-mono text-slate-700">
                  <span className="font-semibold">{comp.levelTitle}</span>
                  <span>
                    Exact: {comp.exactMatches}/{comp.referenceColors.length} · Displacement Error:{' '}
                    {comp.errorScore}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-mono text-slate-500 mb-1">Your Sequence</p>
                    <div className="flex gap-1">
                      {comp.userColors.map((hex, i) => (
                        <div
                          key={`${hex}-u-${i}`}
                          className="flex-1 h-7 rounded border border-slate-300"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-slate-500 mb-1">Reference Sequence</p>
                    <div className="flex gap-1">
                      {comp.referenceColors.map((hex, i) => (
                        <div
                          key={`${hex}-r-${i}`}
                          className="flex-1 h-7 rounded border border-slate-300"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Item-level Review Table */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Item-by-Item Record</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3 border-b border-slate-200">#</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Category</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Reference</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Your Response</th>
                  <th className="py-2.5 px-3 border-b border-slate-200">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.responses.map((item, idx) => (
                  <tr key={`${item.questionId}-${idx}`} className="bg-white">
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">{item.category}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-900">{item.expectedAnswer}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {item.isUnanswered ? 'Cannot See / Unanswered' : item.userAnswer}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {item.isCorrect ? (
                        <span className="text-emerald-700 font-medium">● Matched</span>
                      ) : item.isUnanswered ? (
                        <span className="text-slate-600 font-medium">◆ Unanswered</span>
                      ) : (
                        <span className="text-amber-700 font-medium">▲ Missed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Caveats & Limitations */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="font-semibold text-slate-900 block mb-1">
                Professional Clinical Guidance
              </strong>
              An unremarkable result in this screening does not rule out every form of color vision
              deficiency. If you experience color confusion in daily life or need occupational
              verification, consult a licensed optometrist or ophthalmologist.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-semibold block mb-1">Not a Medical Diagnosis</strong>
              This report reflects an experimental online screening score only and is not a
              clinical diagnosis, sensitivity/specificity assessment, or occupational certificate.
            </div>
          </div>
        </div>

        {result.isGuest && (
          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              Completed in Guest Mode. Sign in from your Account Dashboard if you wish to save future
              screening history across devices.
            </p>
            <button
              type="button"
              onClick={onGoToDashboard}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Open Account &amp; History Dashboard
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
