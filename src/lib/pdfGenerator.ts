import { jsPDF } from 'jspdf';
import { Language } from '../i18n/translations';
import { ScreeningResult } from '../types/vision';
import {
  formatDuration,
  getResultLabelDetails,
  getTestDisplayName,
  localizeCategory,
} from './testEngine';

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generateScreeningPdfReport(
  result: ScreeningResult,
  participantLabel: string,
  lang: Language = 'bn'
): void {
  // Render crisp A4 canvas (1240 x 1754 at 150 DPI) so Unicode Bengali glyphs & conjuncts render cleanly
  const W = 1240;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontStack = '"Noto Sans Bengali", "Plus Jakarta Sans", "DM Sans", sans-serif';
  const margin = 88;
  const contentW = W - margin * 2;
  const isBn = lang === 'bn';

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Header Band
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, W, 178);

  // Vector Aperture Emblem
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(margin + 28, 89, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#3B82F6';
  ctx.beginPath();
  ctx.arc(margin + 28, 89, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 36px ${fontStack}`;
  ctx.fillText('ColorVision Test', margin + 74, 84);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = `400 20px ${fontStack}`;
  ctx.fillText(
    isBn
      ? 'আপনি কীভাবে রঙ দেখেন তা জানুন।  |  প্রাথমিক স্ক্রিনিং ও শিক্ষামূলক প্ল্যাটফর্ম'
      : 'Discover How You See Colors.  |  Preliminary Screening & Educational Platform',
    margin + 74,
    120
  );

  let y = 246;

  // Report Heading
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 38px ${fontStack}`;
  ctx.fillText(
    isBn ? 'COLOR VISION SCREENING REPORT / রঙ দৃষ্টি স্ক্রিনিং রিপোর্ট' : 'COLOR VISION SCREENING REPORT',
    margin,
    y
  );
  y += 28;

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(W - margin, y);
  ctx.stroke();
  y += 42;

  // Metadata
  const localizedTestName = getTestDisplayName(result.testType, lang);
  const dateText = new Date(result.completedAtIso).toLocaleString(isBn ? 'bn-BD' : 'en-US');

  ctx.font = `600 20px ${fontStack}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(isBn ? 'পরীক্ষার মডিউল:' : 'Test Module:', margin, y);
  ctx.font = `500 20px ${fontStack}`;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(localizedTestName, margin + 190, y);

  ctx.font = `600 20px ${fontStack}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(isBn ? 'তারিখ:' : 'Date:', margin + 660, y);
  ctx.font = `400 19px ${fontStack}`;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(dateText, margin + 740, y);
  y += 36;

  ctx.font = `600 20px ${fontStack}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(isBn ? 'অংশগ্রহণকারী:' : 'Participant:', margin, y);
  ctx.font = `500 20px ${fontStack}`;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(participantLabel, margin + 190, y);

  ctx.font = `600 20px ${fontStack}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(isBn ? 'সময়কাল:' : 'Duration:', margin + 660, y);
  ctx.font = `500 20px ${fontStack}`;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(formatDuration(result.durationSeconds, lang), margin + 760, y);
  y += 48;

  // Statistics Strip
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(margin, y, contentW, 134, 12);
  ctx.fill();
  ctx.stroke();

  const stats = [
    { label: isBn ? 'মোট প্রশ্ন/টাইলস' : 'Total Items', value: String(result.totalQuestions) },
    { label: isBn ? 'সঠিক' : 'Correct', value: String(result.correctCount) },
    { label: isBn ? 'ভুল' : 'Incorrect', value: String(result.incorrectCount) },
    { label: isBn ? 'অনুত্তরিত' : 'Unanswered', value: String(result.unansweredCount) },
    {
      label: isBn ? 'পরীক্ষামূলক স্কোর' : 'Experimental Score',
      value: `${result.scorePercentage}%`,
    },
  ];

  const colW = contentW / stats.length;
  stats.forEach((st, idx) => {
    const cx = margin + colW * idx + 22;
    ctx.fillStyle = '#64748B';
    ctx.font = `600 17px ${fontStack}`;
    ctx.fillText(st.label, cx, y + 46);
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 34px ${fontStack}`;
    ctx.fillText(st.value, cx, y + 98);
  });
  y += 172;

  // Outcome Card
  const outcome = getResultLabelDetails(result.resultLabel, lang);
  ctx.font = `400 20px ${fontStack}`;
  const explLines = wrapCanvasText(ctx, outcome.explanation, contentW - 56);
  const outcomeBoxH = 112 + explLines.length * 30;

  ctx.fillStyle = '#F1F5F9';
  ctx.strokeStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.roundRect(margin, y, contentW, outcomeBoxH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1D4ED8';
  ctx.font = `700 18px ${fontStack}`;
  ctx.fillText(
    isBn ? `স্ক্রিনিং ফলাফল — ${outcome.badgeText}` : `SCREENING RESULT — ${outcome.badgeText}`,
    margin + 28,
    y + 42
  );

  ctx.fillStyle = '#0F172A';
  ctx.font = `700 25px ${fontStack}`;
  ctx.fillText(outcome.headline, margin + 28, y + 80);

  ctx.fillStyle = '#334155';
  ctx.font = `400 20px ${fontStack}`;
  explLines.forEach((line, i) => {
    ctx.fillText(line, margin + 28, y + 118 + i * 30);
  });
  y += outcomeBoxH + 48;

  // Category Breakdown Vector Chart
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 24px ${fontStack}`;
  ctx.fillText(
    isBn ? 'ক্যাটাগরি অনুযায়ী পারফরম্যান্স' : 'Performance by Screening Category',
    margin,
    y
  );
  y += 38;

  const barStartX = margin + 410;
  const barMaxW = 460;
  result.categoryBreakdown.slice(0, 8).forEach((cat) => {
    const label = localizeCategory(cat.category, lang);
    const shortLabel = label.length > 34 ? `${label.slice(0, 32)}...` : label;

    ctx.fillStyle = '#1E293B';
    ctx.font = `500 19px ${fontStack}`;
    ctx.fillText(shortLabel, margin, y + 20);

    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(barStartX, y + 3, barMaxW, 22);

    const fillW = (barMaxW * Math.max(0, Math.min(100, cat.accuracyPercent))) / 100;
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(barStartX, y + 3, fillW, 22);

    ctx.fillStyle = '#0F172A';
    ctx.font = `600 18px ${fontStack}`;
    ctx.fillText(
      `${cat.correct}/${cat.total} (${cat.accuracyPercent}%)`,
      barStartX + barMaxW + 20,
      y + 20
    );
    y += 44;
  });

  if (typeof result.arrangementErrors === 'number') {
    y += 12;
    ctx.fillStyle = '#334155';
    ctx.font = `500 19px ${fontStack}`;
    ctx.fillText(
      isBn
        ? `মোট রঙের ক্রম বিচ্যুতি সূচক: ${result.arrangementErrors} (০ মানে রেফারেন্স ক্রমের সাথে হুবহু মিল)`
        : `Total Hue Sequence Displacement Error Index: ${result.arrangementErrors} (0 = exact match)`,
      margin,
      y
    );
  }

  // Disclaimer Box pinned near bottom
  const mandatoryEn =
    'This report is generated from an online preliminary screening exercise. It is not a medical diagnosis, occupational fitness certificate, or substitute for a standardized clinical color vision examination.';
  const mandatoryBn =
    'এই প্রতিবেদনটি একটি অনলাইন প্রাথমিক স্ক্রিনিং অনুশীলন থেকে তৈরি। এটি কোনো চিকিৎসাগত রোগ নির্ণয়, পেশাগত ফিটনেস সনদ বা মানসম্মত ক্লিনিক্যাল রঙ দৃষ্টি পরীক্ষার বিকল্প নয়।';
  const limText = isBn
    ? 'বৈজ্ঞানিক সীমাবদ্ধতা: সাধারণ মনিটর ও মোবাইলের রঙ, উজ্জ্বলতা, ক্যালিব্রেশন ও ঘরের আলোর পার্থক্যের কারণে ফলাফল প্রভাবিত হতে পারে। নিশ্চিত মূল্যায়নের জন্য অনুগ্রহ করে একজন যোগ্য অপটোমেট্রিস্ট বা চক্ষু বিশেষজ্ঞের পরামর্শ নিন।'
    : 'Important Scientific Limitations: Consumer displays vary in color gamut, white balance, brightness, and ambient reflections. Consult a qualified optometrist or ophthalmologist for clinical evaluation.';

  ctx.font = `600 18px ${fontStack}`;
  const mLines = wrapCanvasText(ctx, isBn ? `${mandatoryBn} (${mandatoryEn})` : mandatoryEn, contentW - 56);
  ctx.font = `400 17px ${fontStack}`;
  const lLines = wrapCanvasText(ctx, limText, contentW - 56);

  const discBoxH = 82 + mLines.length * 26 + lLines.length * 24;
  const discY = H - discBoxH - 96;

  ctx.fillStyle = '#FEF9C3';
  ctx.strokeStyle = '#EAB308';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(margin, discY, contentW, discBoxH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#713F12';
  ctx.font = `700 19px ${fontStack}`;
  ctx.fillText(
    isBn ? 'চিকিৎসা সতর্কতা ও বৈজ্ঞানিক সীমাবদ্ধতা' : 'MEDICAL DISCLAIMER & SCIENTIFIC LIMITATIONS',
    margin + 28,
    discY + 38
  );

  ctx.fillStyle = '#422006';
  ctx.font = `600 18px ${fontStack}`;
  mLines.forEach((line, i) => {
    ctx.fillText(line, margin + 28, discY + 72 + i * 26);
  });

  ctx.fillStyle = '#573614';
  ctx.font = `400 17px ${fontStack}`;
  lLines.forEach((line, i) => {
    ctx.fillText(line, margin + 28, discY + 80 + mLines.length * 26 + i * 24);
  });

  // Footer
  ctx.fillStyle = '#64748B';
  ctx.font = `400 17px ${fontStack}`;
  ctx.fillText(
    `Report ID: ${result.id}  |  ColorVision Test`,
    margin,
    H - 42
  );

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  pdf.save(`ColorVision_Screening_Report_${result.id.slice(-8)}.pdf`);
}
