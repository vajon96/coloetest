import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Search, ShieldAlert } from 'lucide-react';
import { BN_ARTICLES, Language } from '../i18n/translations';
import { EducationalArticle } from '../types/vision';

interface KnowledgeCenterProps {
  lang: Language;
  articles: EducationalArticle[];
  onStartScreening: () => void;
}

export const KnowledgeCenter: React.FC<KnowledgeCenterProps> = ({
  lang,
  articles,
  onStartScreening,
}) => {
  const isBn = lang === 'bn';

  const publishedArticles = useMemo(() => {
    const base = articles.filter((a) => a.published).sort((a, b) => a.order - b.order);
    if (!isBn) return base;
    return base.map((art) => {
      const bnMatch = BN_ARTICLES.find((b) => b.id === art.id);
      return bnMatch ?? art;
    });
  }, [articles, isBn]);

  const allTopicsLabel = isBn ? 'সব বিষয়' : 'All Topics';
  const categories = useMemo(
    () => [allTopicsLabel, ...Array.from(new Set(publishedArticles.map((a) => a.category)))],
    [publishedArticles, allTopicsLabel]
  );

  const [selectedCategory, setSelectedCategory] = useState(allTopicsLabel);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string>(publishedArticles[0]?.id ?? '');

  // Keep category selection aligned when language switches
  const activeCategory = categories.includes(selectedCategory)
    ? selectedCategory
    : allTopicsLabel;

  const filteredArticles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return publishedArticles.filter((art) => {
      const catOk = activeCategory === allTopicsLabel || art.category === activeCategory;
      const textOk =
        !term ||
        art.title.toLowerCase().includes(term) ||
        art.summary.toLowerCase().includes(term) ||
        art.content.toLowerCase().includes(term);
      return catOk && textOk;
    });
  }, [publishedArticles, activeCategory, allTopicsLabel, searchTerm]);

  const activeArticle =
    filteredArticles.find((a) => a.id === activeId) ?? filteredArticles[0] ?? null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
            {isBn ? 'শিক্ষামূলক জ্ঞানকেন্দ্র' : 'Educational Knowledge Center'}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            {isBn
              ? 'রঙ দৃষ্টি বিজ্ঞান ও ক্লিনিক্যাল তথ্যভান্ডার'
              : 'Color Vision Science & Clinical Reference'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            {isBn
              ? 'কোন কোষের শারীরতত্ত্ব, বংশগত ও অর্জিত রঙ দৃষ্টি ত্রুটি এবং ক্লিনিক্যাল পরীক্ষা পদ্ধতি সম্পর্কে তথ্যনির্ভর প্রবন্ধ।'
              : 'Evidence-based educational guides on cone physiology, inherited and acquired color vision deficiencies, and clinical diagnostic standards.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onStartScreening}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
        >
          {isBn ? 'স্ক্রিনিং পরীক্ষায় যান' : 'Go to Screening Tests'}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'বিষয় খুঁজুন...' : 'Search vision science topics...'}
            aria-label={isBn ? 'শিক্ষামূলক প্রবন্ধ খুঁজুন' : 'Search educational articles'}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>

      {/* Two-Column Article Browser + Reader */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-2">
          {filteredArticles.length === 0 ? (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-sm text-slate-600">
              {isBn ? 'আপনার অনুসন্ধানের সাথে কোনো প্রবন্ধ মেলেনি।' : 'No articles matched your search filter.'}
            </div>
          ) : (
            filteredArticles.map((art, index) => {
              const selected = activeArticle?.id === art.id;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setActiveId(art.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selected
                      ? 'bg-white border-blue-700 ring-1 ring-blue-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-mono text-slate-500 mb-1">
                    {String(index + 1).padStart(2, '0')}. {art.category}
                  </p>
                  <h2 className="text-sm font-bold text-slate-900 mb-1">{art.title}</h2>
                  <p className="text-xs text-slate-600 line-clamp-2">{art.summary}</p>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-8">
          {activeArticle ? (
            <article className="bg-white hc-surface border border-slate-200 rounded-xl p-6 sm:p-10">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-700 mb-2">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{activeArticle.category}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                {activeArticle.title}
              </h2>
              <p className="text-base text-slate-700 font-medium leading-relaxed mb-6 pb-6 border-b border-slate-200">
                {activeArticle.summary}
              </p>

              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line mb-8">
                {activeArticle.content}
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6">
                <strong className="font-semibold text-slate-900">
                  {isBn ? 'তথ্যসূত্র:' : 'Medical Reference:'}
                </strong>{' '}
                {activeArticle.reference}
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  {isBn
                    ? 'এই শিক্ষামূলক তথ্য সাধারণ শারীরবৃত্তীয় জ্ঞান প্রদানের জন্য; এটি ব্যক্তিগত চিকিৎসাগত রোগ নির্ণয় বা চক্ষু বিশেষজ্ঞের পরামর্শের বিকল্প নয়।'
                    : 'This educational material provides general physiological information and is not a substitute for individualized medical diagnosis or ophthalmic consultation.'}
                </p>
              </div>
            </article>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              {isBn ? 'পড়ার জন্য বাম পাশ থেকে একটি বিষয় নির্বাচন করুন।' : 'Select an educational topic on the left to read.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
