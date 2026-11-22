# ColorVision Test — Preliminary Color Vision Screening & Educational Platform

**Discover How You See Colors.**

ColorVision Test is a responsive, accessible web platform for preliminary color vision screening, interactive hue ordering exercises, vision science education, PDF screening reports, and Firebase-backed personal history and administrative management.

---

## Scientific Limitations & Medical Notice

1. **Not a Medical Diagnostic Device**: This platform is an educational and preliminary online screening tool. It is **not** a certified medical device, cannot diagnose clinical color vision deficiency subtypes (e.g., anomalous trichromacy vs. dichromacy), and cannot issue occupational fitness certifications.
2. **Display Calibration Variance**: Consumer monitors, smartphones, and tablets differ widely in color gamut (sRGB vs. Display-P3), white balance, gamma, peak brightness, and anti-glare coatings. Night Light, Night Shift, True Tone, and ambient room illumination also alter chromatic rendering.
3. **Original Experimental Stimuli**: The Ishihara-inspired plates are procedurally synthesized, original pseudoisochromatic color-dot patterns with luminance jitter—they do **not** copy or reproduce copyrighted commercial Ishihara test plates.
4. **Axis Limitations**: Traditional Ishihara-style plates primarily evaluate red-green discrimination. The included blue-yellow module is explicitly experimental unless validated against a clinical reference test. The Color Arrangement module is an educational hue-ordering exercise and is **not** a certified Farnsworth-Munsell 100 Hue Test.
5. **Clinical Gold Standards**: Standardized clinical diagnosis requires controlled Illuminant C/D65 lighting, physical printed plates (e.g., Ishihara 38-plate or Hardy-Rand-Rittler), calibrated Munsell cap tests (Farnsworth D-15), or a Nagel Anomaloscope administered by a qualified optometrist or ophthalmologist.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
- **Canvas Stimulus Engine**: Seeded Mulberry32 PRNG circle-packed pseudoisochromatic plate generator with per-dot HSL jitter and non-numerical shapes/paths
- **PDF Reporting**: `jsPDF` client-side report builder (`COLOR VISION SCREENING REPORT`) with vector category bar chart and mandatory medical disclaimer
- **Backend & Security**: Firebase Authentication (Google Sign-In + optional Guest Testing Mode) & Cloud Firestore with Eight-Pillar security rules (`firestore.rules`)

---

## Local Setup & Deployment Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Firebase Configuration**:
   - `firebase-applet-config.json` provides the web Firebase configuration (`projectId`, `apiKey`, `authDomain`, `firestoreDatabaseId`).
   - Deploy security rules after any modification to `firestore.rules`:
     ```bash
     npx eslint firestore.rules
     firebase deploy --only firestore:rules
     ```
3. **Run Locally**:
   ```bash
   npm run dev
   ```
4. **Production Build & Hosting (Firebase Hosting or Vercel)**:
   ```bash
   npm run build
   ```
   - **Firebase Hosting**: Run `firebase init hosting` pointing to `dist/` with SPA rewrite (`"rewrites": [{"source": "**", "destination": "/index.html"}]`), then `firebase deploy`.
   - **Vercel**: Connect repository, set build command `npm run build` and output directory `dist`.
