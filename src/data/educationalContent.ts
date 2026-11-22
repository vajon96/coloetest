import { EducationalArticle, FaqItem, SiteConfig } from '../types/vision';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  heroTitle: 'Test Your Color Vision.',
  heroSubtitle:
    'Explore how accurately you distinguish different colors through interactive vision screening tests.',
  disclaimerNotice:
    'ColorVision Test is a preliminary online screening and educational platform. Screen displays vary in calibration, brightness, and color gamut; online exercises cannot replace a standardized clinical examination by an optometrist or ophthalmologist.',
  enabledTests: {
    'ishihara-inspired': true,
    'red-green': true,
    'blue-yellow': true,
    arrangement: true,
  },
};

export const DEFAULT_ARTICLES: EducationalArticle[] = [
  {
    id: 'art-what-is-cvd',
    slug: 'what-is-color-vision-deficiency',
    title: 'What Is Color Vision Deficiency?',
    category: 'Foundations',
    summary:
      'An overview of how reduced chromatic discrimination arises, why the term "color blindness" is often imprecise, and how common inherited deficiencies are worldwide.',
    content: `Color vision deficiency (CVD)—commonly referred to as color blindness—describes a decreased ability to distinguish certain colors or subtle hue differences under normal lighting conditions. Complete inability to perceive any color (achromatopsia) is exceptionally rare; most individuals with color vision deficiency perceive a rich range of colors, though specific wavelengths overlap or appear indistinguishable.

Inherited red-green color vision deficiency affects approximately 8% of males and 0.5% of females of Northern European ancestry. Blue-yellow deficiencies and complete monochromacy occur far less frequently and affect males and females in roughly equal proportions.

Educational screening exercises can help individuals recognize potential patterns of hue confusion, but only a qualified eye care specialist using calibrated clinical instruments can determine exact cone function or issue occupational certifications.`,
    reference: 'National Eye Institute (NEI) — Facts About Color Blindness',
    order: 1,
    published: true,
  },
  {
    id: 'art-how-normal-vision-works',
    slug: 'how-normal-color-vision-works',
    title: 'How Normal Color Vision Works',
    category: 'Visual Physiology',
    summary:
      'Trace the optical pathway from reflected light entering the cornea and lens to retinal photoreceptors and opponent-process neural coding in the visual cortex.',
    content: `Human color perception begins when light waves reflected off objects pass through the cornea and crystalline lens to strike the retina at the back of the eye. Rather than detecting single wavelengths like a spectrophotometer, the human visual system compares relative activation across three distinct classes of cone photoreceptors—a principle known as trichromacy.

Signals from these cones are immediately transformed by retinal bipolar and ganglion cells into opponent-color channels: a red-versus-green channel (L minus M), a blue-versus-yellow channel (S minus [L+M]), and an overall luminance channel (L plus M). These opponent signals travel along the optic nerve to the lateral geniculate nucleus and primary visual cortex (V1/V4), where context, illumination, and memory construct our perception of color.`,
    reference: 'American Academy of Ophthalmology (AAO) — Physiology of Color Perception',
    order: 2,
    published: true,
  },
  {
    id: 'art-cones-in-human-eye',
    slug: 'what-are-cones-in-the-human-eye',
    title: 'What Are Cones in the Human Eye?',
    category: 'Visual Physiology',
    summary:
      'Learn about L, M, and S cone photoreceptors, their peak spectral sensitivities (564 nm, 534 nm, 420 nm), and how opsin photopigments respond to light.',
    content: `The human retina contains two primary families of photoreceptors: roughly 120 million rods (specialized for dim, scotopic monochrome vision) and roughly 6 million cones (concentrated in the central fovea for sharp acuity and daylight color vision).

Normal trichromatic vision relies on three cone subtypes named after the wavelengths to which their opsin photopigments are most sensitive:
• S-Cones (Short-wavelength): Peak sensitivity near 420 nm (violet-blue region). S-cones make up only about 5–8% of total cones.
• M-Cones (Medium-wavelength): Peak sensitivity near 534 nm (green region).
• L-Cones (Long-wavelength): Peak sensitivity near 564 nm (yellow-red region).

Because L-cone and M-cone sensitivity curves overlap substantially across the middle of the visible spectrum, even small genetic shifts in either opsin gene can noticeably narrow red-green color discrimination.`,
    reference: 'Sharpe, L. T. et al., Color Vision: From Genes to Perception (Cambridge Univ. Press)',
    order: 3,
    published: true,
  },
  {
    id: 'art-protanopia-protanomaly',
    slug: 'protanopia-and-protanomaly',
    title: 'Protanopia and Protanomaly',
    category: 'Red-Green Deficiencies',
    summary:
      'Understand L-cone (long-wavelength) deficiencies, including altered spectral sensitivity to deep reds and brightness shifts toward the red end of the spectrum.',
    content: `Protan-type color vision deficiencies involve abnormalities in the L-cone (long-wavelength / red-sensitive) photopigment encoded on the X chromosome (OPN1LW).

• Protanomaly (anomalous trichromacy): L-cones are present, but their peak spectral sensitivity is shifted closer to that of M-cones. Individuals have reduced sensitivity to red-green differences and often require more red light in an anomaloscope color-matching task.
• Protanopia (dichromacy): Functional L-cones are absent altogether. Color perception relies solely on M-cones and S-cones. Deep reds may appear very dark or nearly black, and reds, oranges, yellows, and greens can appear similar in hue depending on luminance.

Online pseudoisochromatic screens cannot reliably separate mild protanomaly from protanopia or deutan subtypes; clinical anomaloscope testing is required for exact classification.`,
    reference: 'Birch, J., Diagnosis of Defective Colour Vision (Butterworth-Heinemann)',
    order: 4,
    published: true,
  },
  {
    id: 'art-deuteranopia-deuteranomaly',
    slug: 'deuteranopia-and-deuteranomaly',
    title: 'Deuteranopia and Deuteranomaly',
    category: 'Red-Green Deficiencies',
    summary:
      'Explore the most common form of inherited color vision deficiency—affecting M-cones—and how it alters green, yellow, orange, and brown discrimination.',
    content: `Deutan-type deficiencies stem from alterations in the M-cone (medium-wavelength / green-sensitive) opsin gene (OPN1MW) on the X chromosome. Deuteranomaly is the single most common form of color vision deficiency overall.

• Deuteranomaly: M-cones exist with a shifted spectral response overlapping closer to L-cones. Most individuals experience mild-to-moderate difficulty separating subtle shades of green, olive, brown, orange, and muted red—especially under dim lighting or low saturation.
• Deuteranopia: Functional M-cones are absent, leaving L-cones and S-cones. Unlike protanopia, overall brightness sensitivity to long-wavelength red light remains largely normal, though reds, yellows, and greens fall along shared confusion lines.`,
    reference: 'National Library of Medicine (MedlinePlus Genetics) — Color Vision Deficiency',
    order: 5,
    published: true,
  },
  {
    id: 'art-tritanopia-tritanomaly',
    slug: 'tritanopia-and-tritanomaly',
    title: 'Tritanopia and Tritanomaly',
    category: 'Blue-Yellow Deficiencies',
    summary:
      'Examine rare S-cone (short-wavelength) deficiencies affecting blue-green and yellow-violet discrimination, and why standard Ishihara plates do not screen for them.',
    content: `Tritan-type deficiencies affect the S-cone (short-wavelength / blue-sensitive) pathway encoded by OPN1SW on chromosome 7. Because this gene is autosomal rather than X-linked, inherited tritan deficiency affects males and females equally and is quite rare (estimated under 1 in 10,000).

• Tritanomaly: Reduced sensitivity of S-cones, leading to confusion between certain blues and greens, or between pale yellows, pinks, and violets.
• Tritanopia: Absence of functional S-cones, leaving only L- and M-cone comparison.

Importantly, traditional Ishihara plates are engineered strictly for red-green screening and do NOT screen for tritan defects. Moreover, acquired blue-yellow shifts are frequently associated with yellowing of the crystalline lens with age, glaucoma, or retinal changes—making professional eye exams particularly important if blue-yellow difficulty appears later in life.`,
    reference: 'Cole, B. L., Assessment of Inherited Colour Vision Defects in Clinical Practice',
    order: 6,
    published: true,
  },
  {
    id: 'art-achromatopsia',
    slug: 'achromatopsia-and-monochromacy',
    title: 'Achromatopsia & Monochromacy',
    category: 'Rare Conditions',
    summary:
      'Clinical distinction between congenital rod monochromacy (achromatopsia), blue-cone monochromacy, and more common dichromatic or anomalous deficiencies.',
    content: `Achromatopsia (rod monochromacy) is a rare autosomal recessive retinal disorder occurring in roughly 1 in 30,000 births. Unlike common red-green deficiencies where cone photoreceptors remain functional in daylight, complete achromatopsia involves non-functional L, M, and S cones.

Because vision depends entirely on rod photoreceptors, individuals with complete achromatopsia typically experience:
• Absence of color discrimination (perceiving shades of luminance/greyscale)
• Marked sensitivity to bright daylight (photophobia / hemeralopia)
• Reduced visual acuity and involuntary eye movements (nystagmus)

Blue-cone monochromacy is a distinct X-linked condition where L- and M-cones are non-functional while S-cones and rods remain active. Both require specialized ophthalmic electroretinography (ERG) and genetic evaluation.`,
    reference: 'National Organization for Rare Disorders (NORD) — Achromatopsia Clinical Overview',
    order: 7,
    published: true,
  },
  {
    id: 'art-inherited-vs-acquired',
    slug: 'inherited-vs-acquired-color-vision-deficiency',
    title: 'Inherited vs. Acquired Color Vision Deficiency',
    category: 'Clinical Insights',
    summary:
      'Learn how stable congenital X-linked traits differ from acquired color vision changes caused by ocular disease, systemic conditions, or medications.',
    content: `Inherited color vision deficiencies are present from birth, remain stable throughout life, and affect both eyes identically. Red-green traits follow X-linked recessive inheritance, while tritan traits are autosomal dominant.

By contrast, acquired color vision deficiency develops later in life, may progress over time, and can affect one eye differently from the other. Common causes include:
• Age-related lens yellowing or cataracts (often reducing blue-violet transmission)
• Diabetic retinopathy, macular degeneration, or optic neuritis
• Glaucoma or elevated intraocular pressure
• Certain systemic medications (e.g., hydroxychloroquine, ethambutol, sildenafil) or neurotoxic exposures

Any sudden or asymmetric change in how you perceive colors should be evaluated promptly by an ophthalmologist or optometrist.`,
    reference: 'Simunovic, M. P., Acquired Color Vision Deficiency (Survey of Ophthalmology)',
    order: 8,
    published: true,
  },
  {
    id: 'art-how-ophthalmologists-test',
    slug: 'how-ophthalmologists-test-color-vision',
    title: 'How Ophthalmologists Test Color Vision',
    category: 'Clinical Diagnostics',
    summary:
      'Why standardized printed plates under controlled Illuminant C/D65 lighting, Farnsworth D-15, and the Nagel Anomaloscope remain the gold standard.',
    content: `A formal clinical color vision evaluation goes far beyond viewing dots on a smartphone or laptop screen. Eye care professionals rely on standardized, calibrated tools under tightly controlled lighting:

1. Standardized Pseudoisochromatic Plates (e.g., Ishihara 38-Plate Edition, Hardy-Rand-Rittler [HRR]): Printed with precision spectrophotometric inks and viewed under calibrated Illuminant C or D65 daylight lamps (never standard warm indoor bulbs or uncalibrated monitors).
2. Arrangement Tests (Farnsworth D-15 & 100-Hue): Physical Munsell pigment caps arranged by the patient in a standardized viewing booth to map confusion axes quantitatively.
3. Nagel Anomaloscope: The clinical gold standard for diagnosing protan vs. deutan defects. The patient adjusts a red-green spectral mixture to match a calibrated yellow reference field, directly measuring cone pigment shifts.`,
    reference: 'CIE / International Colour Vision Society Clinical Testing Guidelines',
    order: 9,
    published: true,
  },
  {
    id: 'art-when-to-seek-exam',
    slug: 'when-to-seek-professional-examination',
    title: 'When to Seek a Professional Eye Examination',
    category: 'Clinical Guidance',
    summary:
      'Clear guidance on when online screening difficulties, occupational requirements, pediatric signs, or sudden color shifts warrant clinical evaluation.',
    content: `You should schedule a comprehensive examination with a licensed optometrist or ophthalmologist if any of the following apply:

• You experienced difficulty on one or more modules in this preliminary screening and want definitive testing.
• You notice a new change in color perception, especially if colors look washed out in one eye compared to the other.
• You are pursuing aviation, maritime, rail, electrical engineering, law enforcement, or military roles that mandate certified color vision testing (such as CAD, anomaloscope, or aviation lantern exams).
• A child consistently confuses color names, struggles with color-coded schoolwork, or avoids coloring tasks.

Remember: an unremarkable result on an online display test does not guarantee normal clinical color vision, and an observed difficulty here is a prompt for proper clinical confirmation—not a diagnosis.`,
    reference: 'American Optometric Association (AOA) — Comprehensive Adult & Pediatric Eye Exam Guidelines',
    order: 10,
    published: true,
  },
];

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-accurate',
    question: 'Can an online color vision test diagnose color blindness?',
    answer:
      'No. An online screening test cannot provide a medical diagnosis or occupational fitness certification. Consumer screens vary widely in color gamut, white point, brightness, and contrast. Use this platform solely as an educational preliminary screen and consult an optometrist or ophthalmologist for clinical evaluation.',
    order: 1,
  },
  {
    id: 'faq-display',
    question: 'Why do I need to turn off Night Light, Night Shift, or True Tone?',
    answer:
      'Features like Night Light, Night Shift, True Tone, and blue-light filters deliberately shift screen white balance toward warm amber hues and compress blue wavelengths. That distortion invalidates chromatic confusion pairs, especially for red-green and blue-yellow exercises.',
    order: 2,
  },
  {
    id: 'faq-ishihara-diff',
    question: 'Are these official Ishihara plates?',
    answer:
      'No. We do not reproduce copyrighted commercial Ishihara plates. Our Ishihara-inspired plates are original, procedurally generated experimental screening patterns designed with luminance jitter and scientifically informed hue axes for educational screening.',
    order: 3,
  },
  {
    id: 'faq-non-numbers',
    question: 'What if I or someone taking the test cannot read numbers?',
    answer:
      'Our screening modules include non-numerical geometric shapes (circles, triangles, squares, diamonds, hexagons, plus signs) and continuous path-tracing plates alongside digits and letters, plus accessible keyboard controls and a "Don\'t Know / Cannot See" option.',
    order: 4,
  },
  {
    id: 'faq-normal-result',
    question: 'If my screening shows "No apparent difficulty", does that mean my color vision is 100% normal?',
    answer:
      'No. A normal online screening result does not rule out mild anomalous trichromacy or rare deficiencies, because uncalibrated displays can introduce subtle contrast cues that make hidden figures easier to spot than on standardized printed plates.',
    order: 5,
  },
  {
    id: 'faq-privacy',
    question: 'Do I need an account to take a test, and how is my data protected?',
    answer:
      'No registration is required. Guest Mode runs entirely without collecting personal information and still lets you download a PDF screening report. If you choose to sign in, your personal screening history is restricted strictly to your account and can be deleted permanently at any time.',
    order: 6,
  },
];
