import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Database, Download, Plus, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { Language } from '../i18n/translations';
import {
  deleteArticleAdmin,
  deleteFaqAdmin,
  deletePlateAdmin,
  fetchAdminDashboardData,
  saveArticleAdmin,
  saveFaqAdmin,
  savePlateAdmin,
  saveSiteConfigAdmin,
  seedDefaultContentToFirestore,
} from '../lib/firestoreService';
import { getTestDisplayName } from '../lib/testEngine';
import {
  AnonymousStat,
  EducationalArticle,
  ExperimentalPlate,
  FaqItem,
  SiteConfig,
  TestModuleId,
} from '../types/vision';
import { PseudoisochromaticPlate } from './PseudoisochromaticPlate';

interface AdminDashboardProps {
  lang: Language;
  isAdmin: boolean;
  articles: EducationalArticle[];
  faqs: FaqItem[];
  plates: ExperimentalPlate[];
  siteConfig: SiteConfig;
  onRefreshPublicContent: () => Promise<void>;
}

type AdminTab = 'overview' | 'articles' | 'faqs' | 'plates' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  isAdmin,
  articles,
  faqs,
  plates,
  siteConfig,
  onRefreshPublicContent,
}) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalScreenings, setTotalScreenings] = useState(0);
  const [anonymousStats, setAnonymousStats] = useState<AnonymousStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [draftConfig, setDraftConfig] = useState<SiteConfig>(siteConfig);
  useEffect(() => {
    setDraftConfig(siteConfig);
  }, [siteConfig]);

  const [editingArticle, setEditingArticle] = useState<EducationalArticle>({
    id: `art_${Date.now()}`,
    slug: 'new-topic',
    title: '',
    category: 'Foundations',
    summary: '',
    content: '',
    reference: 'American Academy of Ophthalmology',
    order: articles.length + 1,
    published: true,
  });

  const [editingFaq, setEditingFaq] = useState<FaqItem>({
    id: `faq_${Date.now()}`,
    question: '',
    answer: '',
    order: faqs.length + 1,
  });

  const [editingPlate, setEditingPlate] = useState<ExperimentalPlate>({
    id: `plate_${Date.now()}`,
    module: 'ishihara-inspired',
    category: 'Red-Green Discrimination',
    stimulusType: 'number',
    targetValue: '42',
    promptText: 'Identify the two-digit number visible within the color-dot circle.',
    options: ['42', '12', '47', '72'],
    fgPalette: ['#C9624B', '#D7715A', '#B8543E'],
    bgPalette: ['#6E964B', '#7CA457', '#5E863E'],
    seed: 4201,
    enabled: true,
  });

  const loadStats = async () => {
    setLoadingStats(true);
    setErrorMessage(null);
    try {
      const data = await fetchAdminDashboardData();
      setTotalUsers(data.totalUsers);
      setTotalScreenings(data.totalScreenings);
      setAnonymousStats(data.anonymousStats);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load admin statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const categoryStatsChart = useMemo(() => {
    const modules: TestModuleId[] = [
      'ishihara-inspired',
      'red-green',
      'blue-yellow',
      'arrangement',
    ];
    return modules.map((mod) => {
      const subset = anonymousStats.filter((s) => s.testType === mod);
      const avgScore =
        subset.length > 0
          ? Math.round((subset.reduce((sum, s) => sum + s.scorePercentage, 0) / subset.length) * 10) /
            10
          : 0;
      return {
        module:
          mod === 'ishihara-inspired'
            ? isBn
              ? 'ইশিহারা'
              : 'Ishihara-Inspired'
            : mod === 'red-green'
            ? isBn
              ? 'লাল-সবুজ'
              : 'Red-Green'
            : mod === 'blue-yellow'
            ? isBn
              ? 'নীল-হলুদ'
              : 'Blue-Yellow'
            : isBn
            ? 'রঙ সাজানো'
            : 'Arrangement',
        Completions: subset.length,
        AvgScore: avgScore,
      };
    });
  }, [anonymousStats, isBn]);

  if (!isAdmin) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-10">
          <ShieldAlert className="w-10 h-10 text-amber-700 mx-auto mb-3" aria-hidden="true" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {isBn ? 'সংরক্ষিত অ্যাডমিন প্যানেল' : 'Restricted Administration Area'}
          </h1>
          <p className="text-sm text-slate-600">
            {isBn
              ? 'নামহীন পরিসংখ্যান, প্লেট কনফিগারেশন এবং কনটেন্ট পরিচালনার জন্য অনুমোদিত অ্যাডমিন অ্যাকাউন্ট প্রয়োজন।'
              : 'Access to anonymized telemetry, plate configuration, and content management requires an authorized administrator account.'}
          </p>
        </div>
      </section>
    );
  }

  const handleExportAnonymousCsv = () => {
    const headers = ['stat_id', 'test_type', 'score_percentage', 'result_label', 'duration_seconds', 'created_at'];
    const rows = anonymousStats.map((s) =>
      [s.id, s.testType, s.scorePercentage, s.resultLabel, s.durationSeconds, s.createdAtIso].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `colorvision_anonymous_stats_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setErrorMessage(null);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-1">
            {isBn ? 'রোল-ভিত্তিক নিয়ন্ত্রিত কনসোল' : 'Role-Protected Console'}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isBn ? 'অ্যাডমিন ম্যানেজমেন্ট ড্যাশবোর্ড' : 'Admin Management Dashboard'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isBn
              ? 'সামগ্রিক নামহীন পরিসংখ্যান, শিক্ষামূলক প্রবন্ধ, পরীক্ষামূলক প্লেট এবং মডিউল নিয়ন্ত্রণ।'
              : 'Aggregated anonymous metrics, educational content, experimental plates, and module availability.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await seedDefaultContentToFirestore();
                await onRefreshPublicContent();
                notify(
                  isBn
                    ? 'নমুনা প্লেট, ১০টি প্রবন্ধ, FAQ এবং সাইট কনফিগ Firestore-এ সংরক্ষিত হয়েছে।'
                    : 'Sample experimental plates, 10 educational articles, FAQs, and site config synced to Firestore.'
                );
              } catch (err) {
                setErrorMessage(err instanceof Error ? err.message : 'Seed failed.');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50"
          >
            <Database className="w-4 h-4" aria-hidden="true" />
            {isBn ? 'Firestore-এ নমুনা তথ্য সিঙ্ক করুন' : 'Sync Sample Data to Firestore'}
          </button>
          <button
            type="button"
            onClick={handleExportAnonymousCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            {isBn ? 'নামহীন CSV এক্সপোর্ট' : 'Export Anonymous CSV'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/70 rounded-lg mb-8 w-fit">
        {(
          [
            { id: 'overview', label: isBn ? 'সারসংক্ষেপ ও পরিসংখ্যান' : 'Overview & Telemetry' },
            { id: 'articles', label: isBn ? 'শিক্ষামূলক প্রবন্ধ' : 'Educational Articles' },
            { id: 'faqs', label: isBn ? 'প্রশ্নোত্তর (FAQ)' : 'FAQs' },
            { id: 'plates', label: isBn ? 'পরীক্ষামূলক প্লেট' : 'Experimental Plates' },
            { id: 'settings', label: isBn ? 'সাইট ও পরীক্ষা নিয়ন্ত্রণ' : 'Site & Availability' },
          ] as Array<{ id: AdminTab; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-mono text-slate-500">
                {isBn ? 'নিবন্ধিত ব্যবহারকারী' : 'Registered Users'}
              </p>
              <p className="text-3xl font-mono font-bold tabular-nums text-slate-900 mt-1">
                {loadingStats ? '...' : totalUsers}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-mono text-slate-500">
                {isBn ? 'সম্পন্ন পরীক্ষা' : 'Completed Tests'}
              </p>
              <p className="text-3xl font-mono font-bold tabular-nums text-slate-900 mt-1">
                {loadingStats ? '...' : totalScreenings}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-mono text-slate-500">
                {isBn ? 'নামহীন পরিসংখ্যান রেকর্ড' : 'Anonymous Stat Records'}
              </p>
              <p className="text-3xl font-mono font-bold tabular-nums text-slate-900 mt-1">
                {loadingStats ? '...' : anonymousStats.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-mono text-slate-500">
                {isBn ? 'সক্রিয় প্লেট' : 'Active Plates'}
              </p>
              <p className="text-3xl font-mono font-bold tabular-nums text-slate-900 mt-1">
                {plates.filter((p) => p.enabled).length}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {isBn
                  ? 'ক্যাটাগরি অনুযায়ী সম্পন্ন পরীক্ষা ও গড় স্কোর'
                  : 'Test Category Completions & Average Experimental Score'}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStatsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="module" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Bar dataKey="Completions" fill="#0F172A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="AvgScore" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                {isBn ? 'সাম্প্রতিক নামহীন পরিসংখ্যান (PII-মুক্ত)' : 'Recent Anonymized Telemetry (Zero PII)'}
              </h2>
              {anonymousStats.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  {isBn
                    ? 'এখনো কোনো নামহীন রেকর্ড সংরক্ষিত হয়নি।'
                    : 'No anonymized records recorded yet.'}
                </p>
              ) : (
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-mono uppercase">
                      <tr>
                        <th className="py-2 px-2 border-b border-slate-200">
                          {isBn ? 'মডিউল' : 'Module'}
                        </th>
                        <th className="py-2 px-2 border-b border-slate-200">
                          {isBn ? 'স্কোর' : 'Score'}
                        </th>
                        <th className="py-2 px-2 border-b border-slate-200">
                          {isBn ? 'ফলাফল' : 'Outcome'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {anonymousStats.slice(0, 12).map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 px-2 text-slate-800">{s.testType}</td>
                          <td className="py-2 px-2 font-mono tabular-nums">{s.scorePercentage}%</td>
                          <td className="py-2 px-2 font-mono">
                            {isBn ? `ধাপ ${s.resultLabel}` : `Label ${s.resultLabel}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARTICLES */}
      {activeTab === 'articles' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'প্রবন্ধ তৈরি / সম্পাদনা' : 'Create / Edit Article'}
            </h2>
            <input
              type="text"
              placeholder={isBn ? 'শিরোনাম' : 'Article Title'}
              value={editingArticle.title}
              onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={isBn ? 'ক্যাটাগরি' : 'Category'}
                value={editingArticle.category}
                onChange={(e) =>
                  setEditingArticle({ ...editingArticle, category: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                placeholder={isBn ? 'ক্রম' : 'Order'}
                value={editingArticle.order}
                onChange={(e) =>
                  setEditingArticle({ ...editingArticle, order: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <textarea
              rows={2}
              placeholder={isBn ? 'সংক্ষিপ্তসার' : 'Concise summary'}
              value={editingArticle.summary}
              onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <textarea
              rows={5}
              placeholder={isBn ? 'বিস্তারিত প্রবন্ধ...' : 'Full educational content...'}
              value={editingArticle.content}
              onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder={isBn ? 'তথ্যসূত্র' : 'Medical Reference Citation'}
              value={editingArticle.reference}
              onChange={(e) =>
                setEditingArticle({ ...editingArticle, reference: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={editingArticle.published}
                onChange={(e) =>
                  setEditingArticle({ ...editingArticle, published: e.target.checked })
                }
              />
              {isBn ? 'জ্ঞানকেন্দ্রে প্রকাশিত' : 'Published in Knowledge Center'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const slug =
                      editingArticle.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '') || 'article';
                    await saveArticleAdmin({ ...editingArticle, slug });
                    await onRefreshPublicContent();
                    notify(isBn ? 'প্রবন্ধ সংরক্ষিত হয়েছে।' : `Saved article "${editingArticle.title}".`);
                  } catch (err) {
                    setErrorMessage(err instanceof Error ? err.message : 'Save failed.');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                {isBn ? 'প্রবন্ধ সংরক্ষণ' : 'Save Article'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingArticle({
                    id: `art_${Date.now()}`,
                    slug: 'new-topic',
                    title: '',
                    category: 'Foundations',
                    summary: '',
                    content: '',
                    reference: 'National Eye Institute (NEI)',
                    order: articles.length + 1,
                    published: true,
                  })
                }
                className="px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                {isBn ? 'নতুন' : 'New'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 mb-2">
              {isBn ? `প্রবন্ধসমূহ (${articles.length})` : `Articles (${articles.length})`}
            </h2>
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-mono text-slate-500">
                    #{art.order} · {art.category} · {art.published ? (isBn ? 'প্রকাশিত' : 'Published') : (isBn ? 'খসড়া' : 'Draft')}
                  </p>
                  <h3 className="text-sm font-bold text-slate-900">{art.title}</h3>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingArticle(art)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-medium rounded-lg"
                  >
                    {isBn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteArticleAdmin(art.id);
                      await onRefreshPublicContent();
                      notify(isBn ? 'প্রবন্ধ মুছে ফেলা হয়েছে।' : `Deleted article "${art.title}".`);
                    }}
                    className="p-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg"
                    aria-label={`Delete ${art.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FAQS */}
      {activeTab === 'faqs' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'FAQ তৈরি / সম্পাদনা' : 'Create / Edit FAQ'}
            </h2>
            <input
              type="text"
              placeholder={isBn ? 'প্রশ্ন' : 'Question'}
              value={editingFaq.question}
              onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <textarea
              rows={4}
              placeholder={isBn ? 'উত্তর' : 'Answer'}
              value={editingFaq.answer}
              onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="number"
              placeholder={isBn ? 'ক্রম' : 'Order'}
              value={editingFaq.order}
              onChange={(e) =>
                setEditingFaq({ ...editingFaq, order: Number(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await saveFaqAdmin(editingFaq);
                  await onRefreshPublicContent();
                  notify(isBn ? 'FAQ সংরক্ষিত হয়েছে।' : 'Saved FAQ entry.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                {isBn ? 'FAQ সংরক্ষণ' : 'Save FAQ'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingFaq({
                    id: `faq_${Date.now()}`,
                    question: '',
                    answer: '',
                    order: faqs.length + 1,
                  })
                }
                className="px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg"
              >
                {isBn ? 'নতুন' : 'New'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 mb-2">
              {isBn ? `প্রশ্নোত্তর (${faqs.length})` : `FAQs (${faqs.length})`}
            </h2>
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-mono text-slate-500">Order #{faq.order}</p>
                  <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                  <p className="text-xs text-slate-600 mt-1">{faq.answer}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingFaq(faq)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-medium rounded-lg"
                  >
                    {isBn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteFaqAdmin(faq.id);
                      await onRefreshPublicContent();
                      notify(isBn ? 'FAQ মুছে ফেলা হয়েছে।' : 'Deleted FAQ entry.');
                    }}
                    className="p-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg"
                    aria-label="Delete FAQ"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXPERIMENTAL PLATES */}
      {activeTab === 'plates' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'পরীক্ষামূলক প্লেট ডিজাইনার' : 'Experimental Plate Designer'}
            </h2>
            <div className="flex justify-center py-2">
              <PseudoisochromaticPlate plate={editingPlate} size={210} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={editingPlate.module}
                onChange={(e) =>
                  setEditingPlate({
                    ...editingPlate,
                    module: e.target.value as ExperimentalPlate['module'],
                  })
                }
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="ishihara-inspired">Ishihara-Inspired</option>
                <option value="red-green">Red-Green</option>
                <option value="blue-yellow">Blue-Yellow</option>
              </select>
              <select
                value={editingPlate.stimulusType}
                onChange={(e) =>
                  setEditingPlate({
                    ...editingPlate,
                    stimulusType: e.target.value as ExperimentalPlate['stimulusType'],
                  })
                }
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="number">Number</option>
                <option value="letter">Letter</option>
                <option value="shape">Geometric Shape</option>
                <option value="path">Path Tracing</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Target Value (e.g., 42, Circle)"
                value={editingPlate.targetValue}
                onChange={(e) =>
                  setEditingPlate({ ...editingPlate, targetValue: e.target.value })
                }
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Seed"
                value={editingPlate.seed}
                onChange={(e) =>
                  setEditingPlate({ ...editingPlate, seed: Number(e.target.value) || 1001 })
                }
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <input
              type="text"
              placeholder="Category"
              value={editingPlate.category}
              onChange={(e) => setEditingPlate({ ...editingPlate, category: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Prompt Text"
              value={editingPlate.promptText}
              onChange={(e) => setEditingPlate({ ...editingPlate, promptText: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Comma-separated options (e.g., 42,12,47,72)"
              value={editingPlate.options.join(',')}
              onChange={(e) =>
                setEditingPlate({
                  ...editingPlate,
                  options: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="FG Hexes (comma separated)"
                value={editingPlate.fgPalette.join(',')}
                onChange={(e) =>
                  setEditingPlate({
                    ...editingPlate,
                    fgPalette: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="BG Hexes (comma separated)"
                value={editingPlate.bgPalette.join(',')}
                onChange={(e) =>
                  setEditingPlate({
                    ...editingPlate,
                    bgPalette: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={editingPlate.enabled}
                onChange={(e) =>
                  setEditingPlate({ ...editingPlate, enabled: e.target.checked })
                }
              />
              {isBn ? 'সক্রিয় স্ক্রিনিং প্লেট' : 'Enabled in Active Screening Pool'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await savePlateAdmin(editingPlate);
                  await onRefreshPublicContent();
                  notify(isBn ? 'প্লেট সংরক্ষিত হয়েছে।' : `Saved plate "${editingPlate.id}".`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                {isBn ? 'প্লেট সংরক্ষণ' : 'Save Plate'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingPlate({
                    ...editingPlate,
                    id: `plate_${Date.now()}`,
                    seed: Math.floor(1000 + Math.random() * 80000),
                  })
                }
                className="px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg"
              >
                {isBn ? 'নতুন আইডি' : 'New ID'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 mb-2">
              {isBn ? `পরীক্ষামূলক প্লেটসমূহ (${plates.length})` : `Experimental Plate Sets (${plates.length})`}
            </h2>
            <div className="max-h-[600px] overflow-y-auto space-y-2.5 pr-1">
              {plates.map((plate) => (
                <div
                  key={plate.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-mono text-slate-500">
                      {plate.module} · {plate.stimulusType} · Target: {plate.targetValue} ·{' '}
                      {plate.enabled ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'নিষ্ক্রিয়' : 'Disabled')}
                    </p>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">{plate.category}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingPlate(plate)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-medium rounded-lg"
                    >
                      {isBn ? 'সম্পাদনা' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deletePlateAdmin(plate.id);
                        await onRefreshPublicContent();
                        notify(isBn ? 'প্লেট মুছে ফেলা হয়েছে।' : `Deleted plate "${plate.id}".`);
                      }}
                      className="p-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg"
                      aria-label={`Delete plate ${plate.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SITE CONTENT & TEST AVAILABILITY */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">
            {isBn ? 'ওয়েবসাইটের লেখা ও পরীক্ষার প্রাপ্যতা' : 'Website Content & Screening Availability'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'হিরো শিরোনাম' : 'Hero Heading'}
              </label>
              <input
                type="text"
                value={draftConfig.heroTitle}
                onChange={(e) => setDraftConfig({ ...draftConfig, heroTitle: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'হিরো উপশিরোনাম' : 'Hero Subtitle'}
              </label>
              <textarea
                rows={2}
                value={draftConfig.heroSubtitle}
                onChange={(e) => setDraftConfig({ ...draftConfig, heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'চিকিৎসা সতর্কবার্তা' : 'Medical Disclaimer Notice'}
              </label>
              <textarea
                rows={3}
                value={draftConfig.disclaimerNotice}
                onChange={(e) =>
                  setDraftConfig({ ...draftConfig, disclaimerNotice: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-3">
                {isBn ? 'স্ক্রিনিং মডিউল চালু/বন্ধ' : 'Screening Module Availability'}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    'ishihara-inspired',
                    'red-green',
                    'blue-yellow',
                    'arrangement',
                  ] as TestModuleId[]
                ).map((mod) => (
                  <label
                    key={mod}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
                  >
                    <span>{getTestDisplayName(mod, lang)}</span>
                    <input
                      type="checkbox"
                      checked={draftConfig.enabledTests[mod]}
                      onChange={(e) =>
                        setDraftConfig({
                          ...draftConfig,
                          enabledTests: {
                            ...draftConfig.enabledTests,
                            [mod]: e.target.checked,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await saveSiteConfigAdmin(draftConfig);
              await onRefreshPublicContent();
              notify(
                isBn
                  ? 'সাইট কনফিগারেশন সংরক্ষিত হয়েছে।'
                  : 'Updated site content and test availability configuration.'
              );
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {isBn ? 'কনফিগারেশন সংরক্ষণ করুন' : 'Save Configuration'}
          </button>
        </div>
      )}
    </section>
  );
};
