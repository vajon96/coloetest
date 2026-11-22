import { jsPDF } from 'jspdf';
import { ScreeningResult } from '../types/vision';
import { formatDuration, getResultLabelDetails } from './testEngine';

export function generateScreeningPdfReport(
  result: ScreeningResult,
  participantLabel: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Top Header Band
  doc.setFillColor(15, 23, 42); // Deep Navy #0F172A
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Vector Aperture Logo Mark
  doc.setDrawColor(96, 165, 250);
  doc.setLineWidth(0.9);
  doc.circle(margin + 5, 17, 5, 'S');
  doc.setFillColor(59, 130, 246);
  doc.circle(margin + 5, 17, 2.1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ColorVision Test', margin + 13, 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Discover How You See Colors.  |  Preliminary Screening & Educational Platform', margin + 13, 21.5);

  y = 46;

  // Report Heading
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('COLOR VISION SCREENING REPORT', margin, y);
  y += 7;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Test Metadata Grid
  const formattedDate = new Date(result.completedAtIso).toLocaleString();
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Test Module:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(result.testName, margin + 32, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Date Completed:', margin + 102, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDate, margin + 132, y);
  y += 6.5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Participant:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(participantLabel, margin + 32, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Duration:', margin + 102, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDuration(result.durationSeconds), margin + 132, y);
  y += 11;

  // Statistics Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  const stats = [
    { label: 'Total Items', value: String(result.totalQuestions) },
    { label: 'Correct', value: String(result.correctCount) },
    { label: 'Incorrect', value: String(result.incorrectCount) },
    { label: 'Unanswered', value: String(result.unansweredCount) },
    { label: 'Experimental Score', value: `${result.scorePercentage}%` },
  ];
  const colW = contentWidth / stats.length;
  stats.forEach((stat, idx) => {
    const cx = margin + colW * idx + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label.toUpperCase(), cx, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(stat.value, cx, y + 18.5);
  });
  y += 34;

  // Screening Result Box
  const outcome = getResultLabelDetails(result.resultLabel);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  const outcomeLines = doc.splitTextToSize(outcome.explanation, contentWidth - 10);
  const outcomeHeight = 20 + outcomeLines.length * 4.6;
  doc.roundedRect(margin, y, contentWidth, outcomeHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text(`SCREENING RESULT — ${outcome.badgeText.toUpperCase()}`, margin + 5, y + 7.5);

  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(outcome.headline, margin + 5, y + 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(outcomeLines, margin + 5, y + 20.5);
  y += outcomeHeight + 10;

  // Category Performance Chart (Vector Bars)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Performance by Screening Category', margin, y);
  y += 6;

  const barMaxW = 72;
  result.categoryBreakdown.forEach((cat) => {
    if (y > 235) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const labelText = cat.category.length > 34 ? `${cat.category.slice(0, 32)}...` : cat.category;
    doc.text(labelText, margin, y + 4);

    const barX = margin + 74;
    doc.setFillColor(226, 232, 240);
    doc.rect(barX, y + 0.8, barMaxW, 4, 'F');

    const fillW = (barMaxW * Math.max(0, Math.min(100, cat.accuracyPercent))) / 100;
    doc.setFillColor(29, 78, 216);
    doc.rect(barX, y + 0.8, fillW, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${cat.correct}/${cat.total} (${cat.accuracyPercent}%)`, barX + barMaxW + 4, y + 4);

    y += 8.5;
  });

  if (typeof result.arrangementErrors === 'number') {
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `Total Hue Sequence Displacement Error Index: ${result.arrangementErrors} (0 indicates exact match with reference gradient)`,
      margin,
      y
    );
    y += 8;
  }

  // Scientific Limitations & Mandatory Disclaimer
  y = Math.max(y + 6, 224);
  if (y > 245) {
    doc.addPage();
    y = 24;
  }

  doc.setFillColor(254, 249, 195);
  doc.setDrawColor(234, 179, 8);
  const mandatoryDisclaimer =
    'This report is generated from an online preliminary screening exercise. It is not a medical diagnosis, occupational fitness certificate, or substitute for a standardized clinical color vision examination.';
  const limitationsText =
    'Important Scientific Limitations: Consumer monitors and mobile displays vary significantly in color gamut, white balance, gamma, brightness, and ambient room reflections. Ishihara-inspired plates primarily explore red-green chromatic discrimination, while online blue-yellow modules are experimental. Definitive assessment requires calibrated clinical tools (such as printed pseudoisochromatic plates under Illuminant C/D65 or a Nagel anomaloscope) administered by a qualified optometrist or ophthalmologist.';

  const discLines = doc.splitTextToSize(mandatoryDisclaimer, contentWidth - 10);
  const limLines = doc.splitTextToSize(limitationsText, contentWidth - 10);
  const boxHeight = 14 + (discLines.length + limLines.length) * 4.2;

  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(113, 63, 18);
  doc.text('MEDICAL DISCLAIMER & SCIENTIFIC LIMITATIONS', margin + 5, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(66, 32, 6);
  doc.text(discLines, margin + 5, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 54, 20);
  doc.text(limLines, margin + 5, y + 14 + discLines.length * 4.2);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report ID: ${result.id}  |  Generated by ColorVision Test`, margin, footerY);

  doc.save(`ColorVision_Screening_Report_${result.id.slice(-8)}.pdf`);
}
