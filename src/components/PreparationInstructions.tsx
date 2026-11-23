import React, { useState } from 'react';
import { ArrowLeft, CheckSquare, Eye, Monitor, ShieldAlert, Square } from 'lucide-react';
import { BN_PREP_CHECKLIST, Language } from '../i18n/translations';
import { getTestDisplayName } from '../lib/testEngine';
import { TestModuleId } from '../types/vision';

interface PreparationInstructionsProps {
  lang: Language;
  testType: TestModuleId;
  onConfirmStart: () => void;
  onCancel: () => void;
}

const EN_PREPARATION_CHECKLIST = [
  {
    title: 'Use a properly functioning display',
    detail: 'Ensure your monitor, laptop, tablet, or smartphone screen has no severe tinting, dimming, or dead zones.',
  },
  {
    title: 'Disable Night Light, Night Shift, True Tone, and blue-light filters',
    detail: 'Adaptive warm-tint and blue-light reduction modes shift white balance toward amber and distort chromatic confusion pairs.',
  },
  {
    title: 'Set comfortable, normal-to-high screen brightness',
    detail: 'Dim screens compress subtle luminance and chroma steps, increasing false difficulty on low-contrast plates.',
  },
  {
    title: 'Avoid tinted glasses or color-altering screen modes',
    detail: 'Remove sunglasses, EnChroma-style tinted lenses, photochromic lenses indoors, or OS accessibility color filters.',
  },
  {
    title: 'Sit in a normally illuminated room',
    detail: 'Avoid direct sunlight glare on the display as well as pitch-dark rooms that alter pupil size and contrast adaptation.',
  },
  {
    title: 'Keep the display at a comfortable viewing distance',
    detail: 'Position your screen roughly 50–75 cm (20–30 inches) away at eye level so dot clusters integrate naturally.',
  },
  {
    title: 'Do not use screenshots or edited images of test plates',
    detail: 'Image compression, color-profile conversion, or contrast editing alters intended chromatic values.',
  },
];

export const PreparationInstructions: React.FC<PreparationInstructionsProps> = ({
  lang,
  testType,
  onConfirmStart,
  onCancel,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const isBn = lang === 'bn';
  const checklist = isBn ? BN_PREP_CHECKLIST : EN_PREPARATION_CHECKLIST;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {isBn ? 'স্ক্রিনিং মডিউলে ফিরে যান' : 'Back to Screening Modules'}
      </button>

      <div className="bg-white hc-surface border border-slate-200 rounded-xl p-6 sm:p-10">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
            {isBn ? 'পরীক্ষাপূর্ব ডিসপ্লে প্রস্তুতি' : 'Pre-Screening Display Preparation'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            {getTestDisplayName(testType, lang)}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {isBn
              ? 'ডিসপ্লে ক্যালিব্রেশন, প্যানেলের রঙের মান, হোয়াইট-পয়েন্ট তাপমাত্রা এবং ঘরের আলো সরাসরি অনলাইন রঙ পার্থক্য পরীক্ষার ফলাফলকে প্রভাবিত করে। শুরু করার আগে নিচের নির্দেশাবলি সম্পন্ন করুন।'
              : 'Display calibration, panel color gamut, white-point temperature, and ambient room lighting directly influence online color discrimination results. Please complete the checklist below before starting.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {checklist.map((item, idx) => (
            <div
              key={item.title}
              className="p-4 rounded-lg bg-slate-50 hc-surface border border-slate-200"
            >
              <p className="text-xs font-mono text-slate-500 mb-1">
                {isBn ? `০${idx + 1}. পরিবেশ যাচাই` : `0${idx + 1}. Environment Check`}
              </p>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Display Calibration & Contrast Sanity Check */}
        <div className="p-5 rounded-lg bg-slate-50 hc-surface border border-slate-200 mb-8">
          <div className="flex items-start gap-3 mb-3">
            <Monitor className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {isBn
                  ? 'ডিসপ্লে ক্যালিব্রেশন কেন ফলাফলে প্রভাব ফেলে?'
                  : 'Why Display Calibration Influences Screening Results'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isBn
                  ? 'মানসম্মত ক্লিনিক্যাল প্লেটগুলো বিশেষ কালিতে মুদ্রিত হয় এবং Illuminant C বা D65 দিবালোকের বাতিতে পরীক্ষা করা হয়। সাধারণ LCD ও OLED স্ক্রিনে রঙ এবং দেখার কোণ ভিন্ন হতে পারে। শুরু করার আগে নিচের ৮টি ধূসর ধাপ আলাদা করতে পারছেন কি না দেখে নিন:'
                  : 'Standardized clinical plates are printed with precision inks and viewed under calibrated Illuminant C or D65 daylight lamps. Consumer LCD and OLED screens vary in sRGB/Display-P3 rendering, gamma curves, and viewing angles. Verify you can distinguish all 8 neutral luminance steps below before proceeding:'}
              </p>
            </div>
          </div>
          <div
            className="grid grid-cols-8 h-6 rounded overflow-hidden border border-slate-300 mt-3"
            role="img"
            aria-label={
              isBn
                ? '৮-ধাপের নিরপেক্ষ ধূসর উজ্জ্বলতা যাচাই বার'
                : '8-step neutral greyscale brightness calibration check bar'
            }
          >
            {[
              '#0F172A',
              '#334155',
              '#475569',
              '#64748B',
              '#94A3B8',
              '#CBD5E1',
              '#E2E8F0',
              '#F8FAFC',
            ].map((shade) => (
              <div key={shade} style={{ backgroundColor: shade }} />
            ))}
          </div>
        </div>

        {/* Scientific Scope Reminder */}
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3 mb-8">
          <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold">
              {isBn ? 'কেবল প্রাথমিক শিক্ষামূলক স্ক্রিনিং:' : 'Preliminary Educational Screening Only:'}
            </strong>{' '}
            {isBn
              ? 'এই মডিউলটি মৌলিক পরীক্ষামূলক উদ্দীপক ব্যবহার করে এবং এটি কোনো অনুমোদিত চিকিৎসা নির্ণয় যন্ত্র নয়। পেশাগত ফিটনেস বা স্ব-রোগ নির্ণয়ের জন্য ফলাফল ব্যবহার করবেন না।'
              : 'This module uses original experimental stimuli and is not a certified medical diagnostic device. Do not use results for occupational fitness or medical self-diagnosis.'}
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            role="checkbox"
            aria-checked={confirmed}
            onClick={() => setConfirmed((prev) => !prev)}
            className="inline-flex items-start sm:items-center gap-3 text-left text-sm font-medium text-slate-900 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {confirmed ? (
              <CheckSquare className="w-5 h-5 text-blue-700 shrink-0" aria-hidden="true" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isBn
                ? 'আমি প্রস্তুতির নির্দেশাবলি পড়েছি এবং স্ক্রিনের কালার ফিল্টার (Night Light / Night Shift / True Tone) বন্ধ করেছি।'
                : 'I have read the preparation instructions and disabled screen color filters (Night Light / Night Shift / True Tone).'}
            </span>
          </button>

          <button
            type="button"
            disabled={!confirmed}
            onClick={onConfirmStart}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
              confirmed
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            {isBn ? 'নিশ্চিত করুন ও স্ক্রিনিং শুরু করুন' : 'Confirm & Begin Screening'}
          </button>
        </div>
      </div>
    </section>
  );
};
