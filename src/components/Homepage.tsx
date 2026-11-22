import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Grid,
  Layers,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { FaqItem, SiteConfig, TestModuleId } from '../types/vision';

interface HomepageProps {
  siteConfig: SiteConfig;
  faqs: FaqItem[];
  plateCounts: Record<Exclude<TestModuleId, 'arrangement'>, number>;
  onStartTest: (testType: TestModuleId) => void;
  onOpenKnowledgeCenter: () => void;
}

const TEST_CATEGORIES: Array<{
  id: TestModuleId;
  indexLabel: string;
  title: string;
  subtitle: string;
  meta: string;
  note: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'ishihara-inspired',
    indexLabel: '01. Ishihara-Inspired Screening',
    title: 'Ishihara Color Plate Test',
    subtitle:
      'Original pseudoisochromatic color-dot plates with numbers, letters, geometric shapes, and tracing paths.',
    meta: 'Red-Green Focus · Non-Numerical Options · ~3 min',
    note: 'Original Ishihara-inspired educational plates — not copyrighted clinical plates.',
    icon: Eye,
  },
  {
    id: 'red-green',
    indexLabel: '02. Protan & Deutan Exploration',
    title: 'Red-Green Color Vision Test',
    subtitle:
      'Targeted chromatic exercises exploring protan-axis, deutan-axis, and similar-color differentiation.',
    meta: 'L & M Cone Axes · Controlled Patterns · ~3 min',
    note: 'Explores red-green differentiation without claiming clinical subtype diagnosis.',
    icon: Layers,
  },
  {
    id: 'blue-yellow',
    indexLabel: '03. S-Cone Experimental Module',
    title: 'Blue-Yellow Color Vision Screening',
    subtitle:
      'Carefully constructed visual exercises exploring tritan-axis blue-yellow and violet-green differentiation.',
    meta: 'Tritan Axis · Experimental Module · ~3 min',
    note: 'Experimental educational module — not validated against clinical reference tests.',
    icon: Grid,
  },
  {
    id: 'arrangement',
    indexLabel: '04. Hue Sequence Ordering',
    title: 'Color Arrangement Test',
    subtitle:
      'Drag-and-drop or keyboard-accessible hue sorting across three difficulty tiers against reference gradients.',
    meta: '3 Difficulty Levels · Error Scoring · ~4 min',
    note: 'Educational hue arrangement exercise — not a certified Farnsworth-Munsell 100 Hue Test.',
    icon: Sliders,
  },
];

export const Homepage: React.FC<HomepageProps> = ({
  siteConfig,
  faqs,
  plateCounts,
  onStartTest,
  onOpenKnowledgeCenter,
}) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id ?? null);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-3">
              ColorVision Test · Discover How You See Colors.
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-5">
              {siteConfig.heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
              {siteConfig.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('screening-modules');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                Start Free Test
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenKnowledgeCenter}
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-slate-300 bg-white text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Learn About Color Blindness
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-6 leading-relaxed max-w-xl">
              No registration required for guest screening · Instant downloadable PDF report ·
              Scientifically framed educational exercises
            </p>
          </div>

          <div className="lg:col-span-6 flex items-stretch">
            <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[260px] flex items-center justify-center">
              {!imgFailed.hero ? (
                <img
                  src="/src/assets/images/hero_color_vision_lab_1795361226911.jpg"
                  alt="Precision glass prism refracting a calibrated visible light spectrum in an optical laboratory"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed((p) => ({ ...p, hero: true }))}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center">
                  <Eye className="w-10 h-10 text-blue-700 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-sm font-semibold text-slate-800">
                    Optical Spectral Calibration Environment
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Four Screening Categories */}
      <section id="screening-modules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
            Screening Modules
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            Select a Preliminary Color Vision Screening
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Each exercise presents randomized stimuli with non-numerical accessibility support and
            generates a downloadable PDF summary report.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TEST_CATEGORIES.map((cat) => {
            const enabled = siteConfig.enabledTests[cat.id];
            const Icon = cat.icon;
            const itemCountText =
              cat.id === 'arrangement'
                ? '3 Levels · 22 Tiles'
                : `${plateCounts[cat.id]} Active Plates`;
            return (
              <article
                key={cat.id}
                className="bg-white hc-surface border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs font-mono text-slate-500">{cat.indexLabel}</span>
                    <Icon className="w-5 h-5 text-blue-700 shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{cat.title}</h3>
                  <p className="text-xs font-mono text-slate-500 mb-4">
                    {itemCountText} · {cat.meta}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{cat.subtitle}</p>
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-3 mb-6">
                    {cat.note}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => onStartTest(cat.id)}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      enabled
                        ? 'bg-slate-900 text-white hover:bg-blue-700'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {enabled ? 'Prepare & Start Screening' : 'Temporarily Unavailable'}
                    {enabled && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* What Is Color Blindness & How Color Vision Works */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <p className="text-xs font-mono uppercase tracking-wider text-blue-700">
                Vision Science Overview
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                What Is Color Blindness?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Color vision deficiency (often called color blindness) refers to a reduced ability
                to distinguish certain hues under normal daylight conditions. Complete absence of
                color perception is rare; the vast majority of affected individuals see many colors
                clearly while experiencing overlap between specific spectral bands such as reds,
                greens, browns, or blues and yellows.
              </p>
              <h3 className="text-lg font-semibold text-slate-900 pt-2">
                How Does Color Vision Work?
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Healthy human trichromatic vision depends on three classes of retinal cone
                photoreceptors: <strong>S-cones</strong> (short wavelength, ~420 nm),{' '}
                <strong>M-cones</strong> (medium wavelength, ~534 nm), and{' '}
                <strong>L-cones</strong> (long wavelength, ~564 nm). Opponent-process retinal
                neurons compare signals across these three cone populations to encode red-green,
                blue-yellow, and brightness contrast.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {!imgFailed.cones ? (
                  <img
                    src="/src/assets/images/diagram_retinal_cones_1795361226785.jpg"
                    alt="Scientific anatomical illustration of retinal cone photoreceptor cells"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed((p) => ({ ...p, cones: true }))}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="p-10 text-center text-sm text-slate-600">
                    Retinal L, M, and S Cone Photoreceptor Diagram
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Different Types of Color Vision Deficiency */}
          <div>
            <div className="max-w-2xl mb-8">
              <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
                Classification Overview
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Different Types of Color Vision Deficiency
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  title: 'Protanopia & Protanomaly',
                  axis: 'L-Cone (Red-Sensitive)',
                  desc: 'Reduced sensitivity or absence of long-wavelength L-cones. Deep reds appear darker, and reds, oranges, and greens can overlap.',
                },
                {
                  title: 'Deuteranopia & Deuteranomaly',
                  axis: 'M-Cone (Green-Sensitive)',
                  desc: 'The most common inherited trait. Shifted or absent M-cones narrow separation between greens, olives, browns, and muted reds.',
                },
                {
                  title: 'Tritanopia & Tritanomaly',
                  axis: 'S-Cone (Blue-Sensitive)',
                  desc: 'Rare autosomal or acquired deficiency affecting S-cones, leading to confusion between blues and greens or yellows and violets.',
                },
                {
                  title: 'Achromatopsia',
                  axis: 'Complete Cone Dysfunction',
                  desc: 'Rare congenital condition where daylight vision relies primarily on rods, causing monochrome perception and light sensitivity.',
                },
              ].map((type) => (
                <div
                  key={type.title}
                  className="p-5 rounded-xl bg-slate-50 hc-surface border border-slate-200"
                >
                  <p className="text-xs font-mono text-blue-700 mb-1.5">{type.axis}</p>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{type.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How the Test Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
              {!imgFailed.clinic ? (
                <img
                  src="/src/assets/images/clinical_ophthalmology_exam_1795361227501.jpg"
                  alt="Modern ophthalmology diagnostic refraction suite"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed((p) => ({ ...p, clinic: true }))}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="p-10 text-center text-sm text-slate-600">
                  Clinical Ophthalmology Assessment Reference
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
                Screening Methodology
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                How the Screening Works
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  step: '01. Display Preparation',
                  text: 'Disable Night Shift, Night Light, and True Tone, set comfortable brightness, and confirm standard room lighting.',
                },
                {
                  step: '02. Randomized Stimuli',
                  text: 'View one randomized experimental plate or hue gradient at a time with non-numerical shapes and Cannot See options.',
                },
                {
                  step: '03. Category Scoring',
                  text: 'Our test engine records response accuracy, duration, and category breakdown without claiming clinical diagnosis.',
                },
                {
                  step: '04. PDF Screening Report',
                  text: 'Review your structured summary chart, download a printable PDF report, or consult an eye care specialist.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-4 rounded-xl bg-white hc-surface border border-slate-200"
                >
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{item.step}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq-section" className="bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
              Frequently Asked Questions
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Screening Limitations &amp; Technical Guidance
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="bg-white">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-slate-900">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-6 sm:p-8 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold text-amber-950 mb-1.5">
              Important Medical Disclaimer &amp; Scientific Limitations
            </h2>
            <p className="text-sm text-amber-900 leading-relaxed mb-2">
              {siteConfig.disclaimerNotice}
            </p>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Anomaloscope matching, standardized printed plates under Illuminant C/D65 lighting, and
              clinical ophthalmic examinations are outside the capability of an ordinary browser-based
              website. Never treat an online result as confirmation that your color vision is
              medically normal or definitively impaired.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
