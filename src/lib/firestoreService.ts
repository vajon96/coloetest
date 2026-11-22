import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { DEFAULT_ARTICLES, DEFAULT_FAQS, DEFAULT_SITE_CONFIG } from '../data/educationalContent';
import { DEFAULT_EXPERIMENTAL_PLATES } from '../data/experimentalPlates';
import {
  AnonymousStat,
  EducationalArticle,
  ExperimentalPlate,
  FaqItem,
  ScreeningResult,
  SiteConfig,
  UserProfile,
} from '../types/vision';
import { BOOTSTRAP_ADMIN_EMAIL, db, handleFirestoreError, OperationType } from './firebase';

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function syncUserProfile(firebaseUser: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const path = `users/${firebaseUser.uid}`;
  const isBootstrapAdmin =
    firebaseUser.emailVerified && firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const role: 'user' | 'admin' = isBootstrapAdmin ? 'admin' : 'user';
      const payload = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'user@colorvision.local',
        displayName: (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User').slice(0, 100),
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, payload);
      return {
        uid: payload.uid,
        email: payload.email,
        displayName: payload.displayName,
        role,
        createdAtIso: new Date().toISOString(),
      };
    }

    const data = snap.data();
    return {
      uid: String(data.uid || firebaseUser.uid),
      email: String(data.email || firebaseUser.email || ''),
      displayName: String(data.displayName || firebaseUser.displayName || 'User'),
      role: isBootstrapAdmin || data.role === 'admin' ? 'admin' : 'user',
      createdAtIso: timestampToIso(data.createdAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function checkIsUserAdmin(firebaseUser: User | null): Promise<boolean> {
  if (!firebaseUser || !firebaseUser.emailVerified) return false;
  if (firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL) return true;
  const adminPath = `admins/${firebaseUser.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', firebaseUser.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function updateUserDisplayName(uid: string, displayName: string): Promise<void> {
  const path = `users/${uid}`;
  const trimmed = displayName.trim().slice(0, 100);
  if (!trimmed) throw new Error('Display name cannot be empty.');
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: trimmed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveScreeningToFirestore(result: ScreeningResult): Promise<void> {
  if (!result.userId) return;
  const screeningPath = `screenings/${result.id}`;
  const statId = `stat_${result.id}`;
  const statPath = `anonymousStats/${statId}`;

  const screeningPayload: Record<string, unknown> = {
    id: result.id,
    userId: result.userId,
    testType: result.testType,
    testName: result.testName.slice(0, 120),
    completedAt: serverTimestamp(),
    totalQuestions: Math.max(1, Math.min(100, Math.round(result.totalQuestions))),
    correctCount: Math.max(0, Math.min(100, Math.round(result.correctCount))),
    incorrectCount: Math.max(0, Math.min(100, Math.round(result.incorrectCount))),
    unansweredCount: Math.max(0, Math.min(100, Math.round(result.unansweredCount))),
    scorePercentage: Math.max(0, Math.min(100, Number(result.scorePercentage))),
    durationSeconds: Math.max(0, Math.min(86400, Math.round(result.durationSeconds))),
    resultLabel: result.resultLabel,
    categoryBreakdown: result.categoryBreakdown.slice(0, 20),
    responses: result.responses.slice(0, 60),
  };

  if (typeof result.arrangementErrors === 'number') {
    screeningPayload.arrangementErrors = Math.max(
      0,
      Math.min(1000, Math.round(result.arrangementErrors))
    );
  }

  try {
    await setDoc(doc(db, 'screenings', result.id), screeningPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, screeningPath);
  }

  try {
    await setDoc(doc(db, 'anonymousStats', statId), {
      id: statId,
      testType: result.testType,
      scorePercentage: Math.max(0, Math.min(100, Number(result.scorePercentage))),
      resultLabel: result.resultLabel,
      durationSeconds: Math.max(0, Math.min(86400, Math.round(result.durationSeconds))),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, statPath);
  }
}

export async function fetchUserScreenings(uid: string): Promise<ScreeningResult[]> {
  const path = 'screenings';
  try {
    const q = query(collection(db, 'screenings'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const items: ScreeningResult[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        userId: String(data.userId || uid),
        testType: data.testType,
        testName: String(data.testName || ''),
        completedAtIso: timestampToIso(data.completedAt),
        totalQuestions: Number(data.totalQuestions || 0),
        correctCount: Number(data.correctCount || 0),
        incorrectCount: Number(data.incorrectCount || 0),
        unansweredCount: Number(data.unansweredCount || 0),
        scorePercentage: Number(data.scorePercentage || 0),
        durationSeconds: Number(data.durationSeconds || 0),
        resultLabel: data.resultLabel,
        arrangementErrors:
          typeof data.arrangementErrors === 'number' ? data.arrangementErrors : undefined,
        categoryBreakdown: Array.isArray(data.categoryBreakdown) ? data.categoryBreakdown : [],
        responses: Array.isArray(data.responses) ? data.responses : [],
        isGuest: false,
      };
    });
    return items.sort(
      (a, b) => new Date(b.completedAtIso).getTime() - new Date(a.completedAtIso).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteUserScreening(screeningId: string): Promise<void> {
  const path = `screenings/${screeningId}`;
  try {
    await deleteDoc(doc(db, 'screenings', screeningId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAllUserData(uid: string): Promise<void> {
  try {
    const q = query(collection(db, 'screenings'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'users', uid));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
  }
}

// Public content loaders with graceful defaults
export async function loadPublicContent(): Promise<{
  articles: EducationalArticle[];
  faqs: FaqItem[];
  plates: ExperimentalPlate[];
  siteConfig: SiteConfig;
}> {
  let articles = DEFAULT_ARTICLES;
  let faqs = DEFAULT_FAQS;
  let plates = DEFAULT_EXPERIMENTAL_PLATES;
  let siteConfig = DEFAULT_SITE_CONFIG;

  try {
    const [artSnap, faqSnap, plateSnap, cfgSnap] = await Promise.all([
      getDocs(query(collection(db, 'articles'), orderBy('order', 'asc'))),
      getDocs(query(collection(db, 'faqs'), orderBy('order', 'asc'))),
      getDocs(collection(db, 'plates')),
      getDoc(doc(db, 'siteConfig', 'main')),
    ]);

    if (!artSnap.empty) {
      articles = artSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          slug: String(data.slug || d.id),
          title: String(data.title || ''),
          category: String(data.category || 'General'),
          summary: String(data.summary || ''),
          content: String(data.content || ''),
          reference: String(data.reference || ''),
          order: Number(data.order || 0),
          published: Boolean(data.published ?? true),
        };
      });
    }

    if (!faqSnap.empty) {
      faqs = faqSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          question: String(data.question || ''),
          answer: String(data.answer || ''),
          order: Number(data.order || 0),
        };
      });
    }

    if (!plateSnap.empty) {
      plates = plateSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          module: data.module,
          category: String(data.category || 'Screening'),
          stimulusType: data.stimulusType,
          targetValue: String(data.targetValue || ''),
          promptText: String(data.promptText || ''),
          options: Array.isArray(data.options) ? data.options.map(String) : [],
          fgPalette: Array.isArray(data.fgPalette) ? data.fgPalette.map(String) : [],
          bgPalette: Array.isArray(data.bgPalette) ? data.bgPalette.map(String) : [],
          seed: Number(data.seed || 1000),
          enabled: Boolean(data.enabled ?? true),
        };
      });
    }

    if (cfgSnap.exists()) {
      const data = cfgSnap.data();
      siteConfig = {
        heroTitle: String(data.heroTitle || DEFAULT_SITE_CONFIG.heroTitle),
        heroSubtitle: String(data.heroSubtitle || DEFAULT_SITE_CONFIG.heroSubtitle),
        disclaimerNotice: String(data.disclaimerNotice || DEFAULT_SITE_CONFIG.disclaimerNotice),
        enabledTests: {
          'ishihara-inspired': Boolean(data.enabledTests?.['ishihara-inspired'] ?? true),
          'red-green': Boolean(data.enabledTests?.['red-green'] ?? true),
          'blue-yellow': Boolean(data.enabledTests?.['blue-yellow'] ?? true),
          arrangement: Boolean(data.enabledTests?.arrangement ?? true),
        },
      };
    }
  } catch (error) {
    console.warn('Using bundled default educational content while Firestore syncs:', error);
  }

  return { articles, faqs, plates, siteConfig };
}

// Admin operations
export async function fetchAdminDashboardData(): Promise<{
  totalUsers: number;
  totalScreenings: number;
  anonymousStats: AnonymousStat[];
}> {
  try {
    const [usersSnap, screeningsSnap, statsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'screenings')),
      getDocs(collection(db, 'anonymousStats')),
    ]);

    const anonymousStats: AnonymousStat[] = statsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        testType: data.testType,
        scorePercentage: Number(data.scorePercentage || 0),
        resultLabel: data.resultLabel,
        durationSeconds: Number(data.durationSeconds || 0),
        createdAtIso: timestampToIso(data.createdAt),
      };
    });

    return {
      totalUsers: usersSnap.size,
      totalScreenings: screeningsSnap.size,
      anonymousStats: anonymousStats.sort(
        (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
      ),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin-dashboard');
  }
}

export async function saveArticleAdmin(article: EducationalArticle): Promise<void> {
  const path = `articles/${article.id}`;
  try {
    await setDoc(doc(db, 'articles', article.id), {
      id: article.id,
      slug: article.slug.slice(0, 120),
      title: article.title.slice(0, 180),
      category: article.category.slice(0, 80),
      summary: article.summary.slice(0, 500),
      content: article.content.slice(0, 12000),
      reference: article.reference.slice(0, 300),
      order: Math.max(0, Math.min(1000, Math.round(article.order))),
      published: Boolean(article.published),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteArticleAdmin(articleId: string): Promise<void> {
  const path = `articles/${articleId}`;
  try {
    await deleteDoc(doc(db, 'articles', articleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveFaqAdmin(faq: FaqItem): Promise<void> {
  const path = `faqs/${faq.id}`;
  try {
    await setDoc(doc(db, 'faqs', faq.id), {
      id: faq.id,
      question: faq.question.slice(0, 240),
      answer: faq.answer.slice(0, 2000),
      order: Math.max(0, Math.min(1000, Math.round(faq.order))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFaqAdmin(faqId: string): Promise<void> {
  const path = `faqs/${faqId}`;
  try {
    await deleteDoc(doc(db, 'faqs', faqId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePlateAdmin(plate: ExperimentalPlate): Promise<void> {
  const path = `plates/${plate.id}`;
  try {
    await setDoc(doc(db, 'plates', plate.id), {
      id: plate.id,
      module: plate.module,
      category: plate.category.slice(0, 80),
      stimulusType: plate.stimulusType,
      targetValue: plate.targetValue.slice(0, 40),
      promptText: plate.promptText.slice(0, 200),
      options: plate.options.slice(0, 8),
      fgPalette: plate.fgPalette.slice(0, 8),
      bgPalette: plate.bgPalette.slice(0, 8),
      seed: Math.max(1, Math.min(9999999, Math.round(plate.seed))),
      enabled: Boolean(plate.enabled),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePlateAdmin(plateId: string): Promise<void> {
  const path = `plates/${plateId}`;
  try {
    await deleteDoc(doc(db, 'plates', plateId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSiteConfigAdmin(config: SiteConfig): Promise<void> {
  const path = 'siteConfig/main';
  try {
    await setDoc(doc(db, 'siteConfig', 'main'), {
      heroTitle: config.heroTitle.slice(0, 140),
      heroSubtitle: config.heroSubtitle.slice(0, 400),
      disclaimerNotice: config.disclaimerNotice.slice(0, 600),
      enabledTests: config.enabledTests,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedDefaultContentToFirestore(): Promise<void> {
  try {
    const batch = writeBatch(db);
    DEFAULT_ARTICLES.forEach((art) => {
      batch.set(doc(db, 'articles', art.id), {
        ...art,
        updatedAt: serverTimestamp(),
      });
    });
    DEFAULT_FAQS.forEach((faq) => {
      batch.set(doc(db, 'faqs', faq.id), {
        ...faq,
        updatedAt: serverTimestamp(),
      });
    });
    DEFAULT_EXPERIMENTAL_PLATES.forEach((plate) => {
      const { isControl: _c, note: _n, ...rest } = plate;
      batch.set(doc(db, 'plates', plate.id), {
        ...rest,
        updatedAt: serverTimestamp(),
      });
    });
    batch.set(doc(db, 'siteConfig', 'main'), {
      ...DEFAULT_SITE_CONFIG,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed-defaults');
  }
}
