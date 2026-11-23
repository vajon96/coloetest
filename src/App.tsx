import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { Contrast, Globe, Menu, Type, X } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { ArrangementTestRunner } from './components/ArrangementTestRunner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Homepage } from './components/Homepage';
import { KnowledgeCenter } from './components/KnowledgeCenter';
import { PlateTestRunner } from './components/PlateTestRunner';
import { PreparationInstructions } from './components/PreparationInstructions';
import { ResultDashboard } from './components/ResultDashboard';
import { UserDashboard } from './components/UserDashboard';
import { DEFAULT_ARTICLES, DEFAULT_FAQS, DEFAULT_SITE_CONFIG } from './data/educationalContent';
import { DEFAULT_EXPERIMENTAL_PLATES } from './data/experimentalPlates';
import { BN_SITE_TEXT, Language } from './i18n/translations';
import { auth, googleProvider, testConnection } from './lib/firebase';
import {
  checkIsUserAdmin,
  deleteAllUserData,
  deleteUserScreening,
  fetchUserScreenings,
  loadPublicContent,
  saveScreeningToFirestore,
  syncUserProfile,
  updateUserDisplayName,
} from './lib/firestoreService';
import {
  EducationalArticle,
  ExperimentalPlate,
  FaqItem,
  ScreeningResult,
  SiteConfig,
  TestModuleId,
  UserProfile,
} from './types/vision';

type AppView =
  | 'home'
  | 'knowledge'
  | 'prepare'
  | 'running'
  | 'result'
  | 'dashboard'
  | 'admin';

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [view, setView] = useState<AppView>('home');
  const [activeTestType, setActiveTestType] = useState<TestModuleId>('ishihara-inspired');
  const [activeResult, setActiveResult] = useState<ScreeningResult | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Accessibility toggles
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Public content state
  const [articles, setArticles] = useState<EducationalArticle[]>(DEFAULT_ARTICLES);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [plates, setPlates] = useState<ExperimentalPlate[]>(DEFAULT_EXPERIMENTAL_PLATES);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  // Auth & personal history state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savedScreenings, setSavedScreenings] = useState<ScreeningResult[]>([]);
  const [guestScreenings, setGuestScreenings] = useState<ScreeningResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  const isBn = lang === 'bn';

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-large-text', largeText);
  }, [largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-high-contrast', highContrast);
  }, [highContrast]);

  const refreshPublicContent = useCallback(async () => {
    const content = await loadPublicContent();
    setArticles(content.articles);
    setFaqs(content.faqs);
    setPlates(content.plates);
    setSiteConfig(content.siteConfig);
  }, []);

  useEffect(() => {
    testConnection();
    refreshPublicContent();
  }, [refreshPublicContent]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setIsAdmin(false);
        setSavedScreenings([]);
        return;
      }

      setLoadingHistory(true);
      try {
        const [profile, adminFlag, history] = await Promise.all([
          syncUserProfile(user),
          checkIsUserAdmin(user),
          fetchUserScreenings(user.uid),
        ]);
        setUserProfile(profile);
        setIsAdmin(adminFlag);
        setSavedScreenings(history);
      } catch (err) {
        console.error('Error loading authenticated user context:', err);
      } finally {
        setLoadingHistory(false);
      }
    });
    return () => unsub();
  }, []);

  const plateCounts = useMemo(
    () => ({
      'ishihara-inspired': plates.filter(
        (p) => p.module === 'ishihara-inspired' && p.enabled
      ).length,
      'red-green': plates.filter((p) => p.module === 'red-green' && p.enabled).length,
      'blue-yellow': plates.filter((p) => p.module === 'blue-yellow' && p.enabled).length,
    }),
    [plates]
  );

  const navigate = (nextView: AppView) => {
    setView(nextView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartTest = (testType: TestModuleId) => {
    setActiveTestType(testType);
    navigate('prepare');
  };

  const handleTestCompleted = async (result: ScreeningResult) => {
    setActiveResult(result);
    navigate('result');

    if (firebaseUser) {
      try {
        await saveScreeningToFirestore(result);
        setSavedScreenings((prev) => [result, ...prev]);
      } catch (err) {
        console.error('Failed to persist screening result to Firestore:', err);
      }
    } else {
      setGuestScreenings((prev) => [result, ...prev]);
    }
  };

  const handleSignInGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    if (view === 'admin') {
      navigate('home');
    }
  };

  const handleUpdateDisplayName = async (name: string) => {
    if (!firebaseUser) return;
    await updateUserDisplayName(firebaseUser.uid, name);
    setUserProfile((prev) => (prev ? { ...prev, displayName: name } : prev));
  };

  const handleDeleteScreening = async (screeningId: string) => {
    await deleteUserScreening(screeningId);
    setSavedScreenings((prev) => prev.filter((s) => s.id !== screeningId));
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    try {
      await deleteAllUserData(uid);
      await deleteUser(firebaseUser);
      setSavedScreenings([]);
      setUserProfile(null);
      setIsAdmin(false);
      navigate('home');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/requires-recent-login') {
        await reauthenticateWithPopup(firebaseUser, googleProvider);
        await deleteAllUserData(uid);
        await deleteUser(firebaseUser);
        setSavedScreenings([]);
        setUserProfile(null);
        setIsAdmin(false);
        navigate('home');
      } else {
        throw err;
      }
    }
  };

  const participantLabel = firebaseUser
    ? userProfile?.displayName ||
      firebaseUser.email ||
      (isBn ? 'নিবন্ধিত অংশগ্রহণকারী' : 'Registered Participant')
    : isBn
    ? 'গেস্ট অংশগ্রহণকারী'
    : 'Guest Participant';

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Strict 3-Zone Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            {/* Zone 1: Brand Wordmark */}
            <button
              type="button"
              onClick={() => navigate('home')}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors"
            >
              ColorVision Test
            </button>

            {/* Zone 2: Single-line Nav Links */}
            <nav
              aria-label={isBn ? 'প্রধান ন্যাভিগেশন' : 'Primary navigation'}
              className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
            >
              <button
                type="button"
                onClick={() => {
                  navigate('home');
                  window.setTimeout(() => {
                    document
                      .getElementById('screening-modules')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
                className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors"
              >
                {isBn ? BN_SITE_TEXT.nav.screenings : 'Screenings'}
              </button>
              <button
                type="button"
                onClick={() => navigate('knowledge')}
                className={`hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors ${
                  view === 'knowledge' ? 'text-blue-700 font-semibold' : ''
                }`}
              >
                {isBn ? BN_SITE_TEXT.nav.knowledge : 'Knowledge Center'}
              </button>
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className={`hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors ${
                  view === 'dashboard' ? 'text-blue-700 font-semibold' : ''
                }`}
              >
                {firebaseUser
                  ? isBn
                    ? BN_SITE_TEXT.nav.dashboard
                    : 'Dashboard'
                  : isBn
                  ? BN_SITE_TEXT.nav.account
                  : 'Account'}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('admin')}
                  className={`hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors ${
                    view === 'admin' ? 'text-blue-700 font-semibold' : ''
                  }`}
                >
                  {isBn ? BN_SITE_TEXT.nav.admin : 'Admin'}
                </button>
              )}
            </nav>

            {/* Zone 3: Single Primary Action */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleStartTest('ishihara-inspired')}
                className="hidden sm:inline-flex px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                {isBn ? BN_SITE_TEXT.nav.startFreeTest : 'Start Free Test'}
              </button>

              <button
                type="button"
                aria-label={
                  mobileMenuOpen
                    ? isBn
                      ? 'মেনু বন্ধ করুন'
                      : 'Close navigation menu'
                    : isBn
                    ? 'মেনু খুলুন'
                    : 'Open navigation menu'
                }
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg border border-slate-300 text-slate-700"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
              <button
                type="button"
                onClick={() => navigate('home')}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-800 rounded-lg hover:bg-slate-50"
              >
                {isBn ? BN_SITE_TEXT.nav.screenings : 'Screenings'}
              </button>
              <button
                type="button"
                onClick={() => navigate('knowledge')}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-800 rounded-lg hover:bg-slate-50"
              >
                {isBn ? BN_SITE_TEXT.nav.knowledge : 'Knowledge Center'}
              </button>
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-800 rounded-lg hover:bg-slate-50"
              >
                {firebaseUser
                  ? isBn
                    ? BN_SITE_TEXT.nav.dashboard
                    : 'Dashboard'
                  : isBn
                  ? BN_SITE_TEXT.nav.accountGuest
                  : 'Account & Guest Mode'}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('admin')}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-blue-700 rounded-lg hover:bg-slate-50"
                >
                  {isBn ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleStartTest('ishihara-inspired')}
                className="w-full px-4 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg"
              >
                {isBn ? BN_SITE_TEXT.nav.startFreeTest : 'Start Free Test'}
              </button>
            </div>
          )}
        </header>

        {/* Main View */}
        <main className="flex-1">
          {view === 'home' && (
            <Homepage
              lang={lang}
              siteConfig={siteConfig}
              faqs={faqs}
              plateCounts={plateCounts}
              onStartTest={handleStartTest}
              onOpenKnowledgeCenter={() => navigate('knowledge')}
            />
          )}

          {view === 'knowledge' && (
            <KnowledgeCenter
              lang={lang}
              articles={articles}
              onStartScreening={() => {
                navigate('home');
                window.setTimeout(() => {
                  document
                    .getElementById('screening-modules')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }, 80);
              }}
            />
          )}

          {view === 'prepare' && (
            <PreparationInstructions
              lang={lang}
              testType={activeTestType}
              onConfirmStart={() => navigate('running')}
              onCancel={() => navigate('home')}
            />
          )}

          {view === 'running' && activeTestType !== 'arrangement' && (
            <PlateTestRunner
              lang={lang}
              testType={activeTestType}
              allPlates={plates}
              userId={firebaseUser?.uid ?? null}
              onComplete={handleTestCompleted}
              onExit={() => navigate('home')}
              onReviewInstructions={() => setShowInstructionsModal(true)}
            />
          )}

          {view === 'running' && activeTestType === 'arrangement' && (
            <ArrangementTestRunner
              lang={lang}
              userId={firebaseUser?.uid ?? null}
              onComplete={handleTestCompleted}
              onExit={() => navigate('home')}
              onReviewInstructions={() => setShowInstructionsModal(true)}
            />
          )}

          {view === 'result' && activeResult && (
            <ResultDashboard
              lang={lang}
              result={activeResult}
              participantLabel={participantLabel}
              onRetakeTest={handleStartTest}
              onBackToHome={() => navigate('home')}
              onGoToDashboard={() => navigate('dashboard')}
            />
          )}

          {view === 'dashboard' && (
            <UserDashboard
              lang={lang}
              firebaseUser={firebaseUser}
              userProfile={userProfile}
              savedScreenings={savedScreenings}
              guestScreenings={guestScreenings}
              loadingHistory={loadingHistory}
              onSignInGoogle={handleSignInGoogle}
              onSignOut={handleSignOut}
              onUpdateDisplayName={handleUpdateDisplayName}
              onViewReport={(rep) => {
                setActiveResult(rep);
                navigate('result');
              }}
              onDeleteScreening={handleDeleteScreening}
              onDeleteAccount={handleDeleteAccount}
              onStartTestFlow={() => handleStartTest('ishihara-inspired')}
            />
          )}

          {view === 'admin' && (
            <AdminDashboard
              lang={lang}
              isAdmin={isAdmin}
              articles={articles}
              faqs={faqs}
              plates={plates}
              siteConfig={siteConfig}
              onRefreshPublicContent={refreshPublicContent}
            />
          )}
        </main>

        {/* Review Instructions Modal during an active test */}
        {showInstructionsModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-inst-title"
          >
            <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="review-inst-title" className="text-lg font-bold text-slate-900">
                  {isBn ? 'ডিসপ্লে প্রস্তুতির নির্দেশনা' : 'Display Preparation Reminder'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  aria-label={isBn ? 'নির্দেশনা বন্ধ করুন' : 'Close instructions'}
                  className="p-1 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 list-disc pl-5 leading-relaxed">
                {isBn ? (
                  <>
                    <li>Night Light, Night Shift, True Tone ও ব্লু-লাইট ফিল্টার বন্ধ করুন।</li>
                    <li>স্বস্তিদায়ক, মাঝারি-থেকে-উচ্চ স্ক্রিন উজ্জ্বলতা সেট করুন।</li>
                    <li>রঙিন চশমা বা কালার ফিল্টার ব্যবহার করবেন না।</li>
                    <li>স্বাভাবিক আলোকিত ঘরে স্বস্তিদায়ক দূরত্বে বসুন।</li>
                    <li>টেস্ট প্লেটের স্ক্রিনশট বা সম্পাদিত ছবি ব্যবহার করবেন না।</li>
                  </>
                ) : (
                  <>
                    <li>Disable Night Light, Night Shift, True Tone, and blue-light filters.</li>
                    <li>Set comfortable, normal-to-high screen brightness.</li>
                    <li>Remove tinted glasses or color-altering filters.</li>
                    <li>Sit in a normally illuminated room at a comfortable distance.</li>
                    <li>Do not use screenshots or edited plate images.</li>
                  </>
                )}
              </ul>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  {isBn ? 'স্ক্রিনিং চালিয়ে যান' : 'Resume Screening'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiet Footer with Accessibility & Language Controls */}
        <footer className="bg-white border-t border-slate-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-slate-900">
                ColorVision Test ·{' '}
                {isBn ? BN_SITE_TEXT.tagline : 'Discover How You See Colors.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {isBn
                  ? BN_SITE_TEXT.footer.desc
                  : 'Preliminary online color vision screening and educational platform. Not a certified medical diagnostic device or occupational fitness substitute.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setLang((prev) => (prev === 'bn' ? 'en' : 'bn'))}
                aria-label="Toggle language between Bangla and English"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                {isBn ? 'ভাষা: বাংলা (EN)' : 'Language: EN (বাংলা)'}
              </button>
              <button
                type="button"
                aria-pressed={largeText}
                onClick={() => setLargeText((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  largeText
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
                {isBn ? BN_SITE_TEXT.footer.largeText : 'Large Text'}
              </button>
              <button
                type="button"
                aria-pressed={highContrast}
                onClick={() => setHighContrast((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  highContrast
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
                {isBn ? BN_SITE_TEXT.footer.highContrast : 'High Contrast'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
