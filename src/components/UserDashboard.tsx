import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Download,
  FileText,
  LogIn,
  LogOut,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { generateScreeningPdfReport } from '../lib/pdfGenerator';
import { formatDuration, getResultLabelDetails, getTestDisplayName } from '../lib/testEngine';
import { ScreeningResult, UserProfile } from '../types/vision';

interface UserDashboardProps {
  lang: Language;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  savedScreenings: ScreeningResult[];
  guestScreenings: ScreeningResult[];
  loadingHistory: boolean;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onUpdateDisplayName: (name: string) => Promise<void>;
  onViewReport: (result: ScreeningResult) => void;
  onDeleteScreening: (screeningId: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onStartTestFlow: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  lang,
  firebaseUser,
  userProfile,
  savedScreenings,
  guestScreenings,
  loadingHistory,
  onSignInGoogle,
  onSignOut,
  onUpdateDisplayName,
  onViewReport,
  onDeleteScreening,
  onDeleteAccount,
  onStartTestFlow,
}) => {
  const isBn = lang === 'bn';
  const [editingName, setEditingName] = useState(userProfile?.displayName || '');
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const participantLabel = firebaseUser
    ? userProfile?.displayName || firebaseUser.email || (isBn ? 'নিবন্ধিত অংশগ্রহণকারী' : 'Registered Participant')
    : isBn
    ? 'গেস্ট অংশগ্রহণকারী'
    : 'Guest Participant';

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    setBusyAction(true);
    setNameStatus(null);
    setErrorMsg(null);
    try {
      await onUpdateDisplayName(editingName.trim());
      setNameStatus(isBn ? 'প্রদর্শিত নাম হালনাগাদ হয়েছে।' : 'Display name updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update name.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setBusyAction(true);
    setErrorMsg(null);
    try {
      await onDeleteAccount();
      setConfirmDeleteAccount(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isBn
          ? 'অ্যাকাউন্ট মুছে ফেলা যায়নি। অনুগ্রহ করে পুনরায় সাইন ইন করে চেষ্টা করুন।'
          : 'Could not delete account. Please sign in again to verify recent authentication.'
      );
    } finally {
      setBusyAction(false);
    }
  };

  const activeList = firebaseUser ? savedScreenings : guestScreenings;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
          {isBn ? 'ব্যক্তিগত স্ক্রিনিং পোর্টাল' : 'Personal Screening Portal'}
        </p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {firebaseUser
            ? isBn
              ? 'ব্যক্তিগত পরীক্ষার ড্যাশবোর্ড'
              : 'Personal Test Dashboard'
            : isBn
            ? 'গেস্ট মোড ও অ্যাকাউন্ট পোর্টাল'
            : 'Guest Mode & Account Portal'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          {firebaseUser
            ? isBn
              ? 'পূর্ববর্তী স্ক্রিনিং রিপোর্ট দেখুন, PDF সারসংক্ষেপ ডাউনলোড করুন অথবা আপনার ব্যক্তিগত তথ্য পরিচালনা করুন।'
              : 'Review previous screening reports, download PDF summaries, or manage your personal data.'
            : isBn
            ? 'নিবন্ধন ছাড়াই গেস্ট মোডে পরীক্ষা দিন, অথবা ডিভাইস জুড়ে রিপোর্ট সংরক্ষণ করতে সাইন ইন করুন।'
            : 'Take screenings in Guest Mode without registration, or sign in to save reports across sessions.'}
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
        >
          {errorMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Account Card */}
        <div className="lg:col-span-4 space-y-6">
          {!firebaseUser ? (
            <div className="bg-white hc-surface border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  {isBn ? 'সাইন ইন বা নিবন্ধন' : 'Sign In or Register'}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBn
                    ? 'নিবন্ধন ঐচ্ছিক। গুগল দিয়ে সাইন ইন করলে আপনার স্ক্রিনিং ফলাফল ব্যক্তিগতভাবে সংরক্ষিত থাকবে।'
                    : 'Registration is optional. Signing in with Google lets you store screening records privately and access them anytime.'}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setErrorMsg(null);
                  try {
                    await onSignInGoogle();
                  } catch (err) {
                    setErrorMsg(
                      err instanceof Error ? err.message : 'Sign-in was cancelled or blocked.'
                    );
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                {isBn ? 'Google দিয়ে চালিয়ে যান' : 'Continue with Google'}
              </button>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  {isBn ? 'গেস্ট মোড সক্রিয়' : 'Guest Mode Active'}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {isBn
                    ? 'গেস্ট পরীক্ষায় কোনো ব্যক্তিগত তথ্য সংগ্রহ করা হয় না। এই সেশনের রিপোর্ট ট্যাব বন্ধ না করা পর্যন্ত এখানে দেখা যাবে।'
                    : 'Guest screenings require zero personal data. Session reports remain available in browser memory until you close the tab.'}
                </p>
                <button
                  type="button"
                  onClick={onStartTestFlow}
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  {isBn ? 'গেস্ট স্ক্রিনিং শুরু করুন' : 'Start Guest Screening'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white hc-surface border border-slate-200 rounded-xl p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 mb-1">
                  <UserCheck className="w-4 h-4" aria-hidden="true" />
                  <span>{isBn ? 'নিবন্ধিত অ্যাকাউন্ট' : 'Authenticated Account'}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {userProfile?.displayName || firebaseUser.displayName || 'Participant'}
                </h2>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{firebaseUser.email}</p>
                {userProfile?.role === 'admin' && (
                  <p className="text-xs font-mono text-blue-700 mt-1">
                    {isBn ? 'ভূমিকা: অ্যাডমিনিস্ট্রেটর' : 'Role: Administrator'}
                  </p>
                )}
              </div>

              <form onSubmit={handleSaveName} className="space-y-3 pt-4 border-t border-slate-200">
                <label className="block text-xs font-medium text-slate-700" htmlFor="displayNameInput">
                  {isBn ? 'রিপোর্টে প্রদর্শিত নাম' : 'Display Name on Reports'}
                </label>
                <input
                  id="displayNameInput"
                  type="text"
                  maxLength={100}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder={isBn ? 'আপনার নাম লিখুন' : 'Enter display name'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700"
                />
                <button
                  type="submit"
                  disabled={busyAction}
                  className="w-full px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  {isBn ? 'নাম সংরক্ষণ করুন' : 'Save Profile Name'}
                </button>
                {nameStatus && <p className="text-xs text-emerald-700">{nameStatus}</p>}
              </form>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 bg-white text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  {isBn ? 'সাইন আউট' : 'Sign Out'}
                </button>

                {!confirmDeleteAccount ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAccount(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100"
                  >
                    <UserX className="w-4 h-4" aria-hidden="true" />
                    {isBn ? 'অ্যাকাউন্ট ও ব্যক্তিগত তথ্য মুছুন' : 'Delete Account & Personal Data'}
                  </button>
                ) : (
                  <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 space-y-3">
                    <p className="text-xs text-rose-900 font-medium leading-relaxed">
                      {isBn
                        ? 'এতে আপনার প্রোফাইল, সংরক্ষিত সমস্ত পরীক্ষার ইতিহাস এবং লগইন অ্যাকাউন্ট স্থায়ীভাবে মুছে যাবে।'
                        : 'This permanently deletes your user profile, all saved screening history, and your authentication record. This action cannot be undone.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={handleConfirmDeleteAccount}
                        className="flex-1 px-3 py-2 bg-rose-700 text-white text-xs font-semibold rounded-lg hover:bg-rose-800 disabled:opacity-50"
                      >
                        {isBn ? 'স্থায়ীভাবে মুছুন' : 'Confirm Permanent Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAccount(false)}
                        className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                      >
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Screening History */}
        <div className="lg:col-span-8">
          <div className="bg-white hc-surface border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {firebaseUser
                    ? isBn
                      ? 'সংরক্ষিত পরীক্ষার ইতিহাস'
                      : 'Saved Screening History'
                    : isBn
                    ? 'বর্তমান সেশনের রিপোর্ট (গেস্ট)'
                    : 'Current Session Reports (Guest)'}
                </h2>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {activeList.length}{' '}
                  {isBn
                    ? 'টি রিপোর্ট উপলব্ধ'
                    : activeList.length === 1
                    ? 'report available'
                    : 'reports available'}
                </p>
              </div>
              <button
                type="button"
                onClick={onStartTestFlow}
                className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800"
              >
                {isBn ? 'নতুন স্ক্রিনিং পরীক্ষা' : 'New Screening Test'}
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-sm text-slate-500">
                {isBn ? 'পরীক্ষার তথ্য লোড হচ্ছে...' : 'Loading screening records...'}
              </div>
            ) : activeList.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-800">
                  {isBn ? 'এখনো কোনো স্ক্রিনিং রিপোর্ট নেই' : 'No screening reports yet'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isBn
                    ? 'বিস্তারিত চার্ট দেখতে এবং PDF স্ক্রিনিং রিপোর্ট ডাউনলোড করতে যেকোনো একটি স্ক্রিনিং মডিউল সম্পন্ন করুন।'
                    : 'Complete any screening module to view detailed category charts and download a printable PDF screening report.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeList.map((item) => {
                  const outcome = getResultLabelDetails(item.resultLabel, lang);
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-slate-500">
                          {new Date(item.completedAtIso).toLocaleString(isBn ? 'bn-BD' : 'en-US')} ·{' '}
                          {formatDuration(item.durationSeconds, lang)} ·{' '}
                          {isBn ? 'স্কোর:' : 'Score:'}{' '}
                          <span className="font-semibold text-slate-900">
                            {item.scorePercentage}%
                          </span>
                        </p>
                        <h3 className="text-base font-bold text-slate-900">
                          {getTestDisplayName(item.testType, lang)}
                        </h3>
                        <p className="text-xs text-slate-700">
                          {outcome.badgeText} — {outcome.headline}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onViewReport(item)}
                          className="px-3 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100"
                        >
                          {isBn ? 'রিপোর্ট দেখুন' : 'View Report'}
                        </button>
                        <button
                          type="button"
                          onClick={() => generateScreeningPdfReport(item, participantLabel, lang)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          PDF
                        </button>
                        {firebaseUser && (
                          <button
                            type="button"
                            onClick={() => onDeleteScreening(item.id)}
                            aria-label={`Delete report ${item.testName}`}
                            className="p-2 border border-rose-200 bg-white text-rose-700 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
