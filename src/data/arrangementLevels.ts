export interface ArrangementLevel {
  id: string;
  title: string;
  difficulty: 'Standard' | 'Intermediate' | 'Advanced';
  description: string;
  startAnchor: { color: string; label: string };
  endAnchor: { color: string; label: string };
  referenceSequence: string[];
  seed: number;
}

/**
 * Original hue arrangement exercises inspired by clinical cap-arrangement tasks.
 * IMPORTANT: This is an educational hue-ordering exercise, NOT a certified
 * Farnsworth-Munsell 100 Hue Test or standardized Munsell cap instrument.
 */
export const ARRANGEMENT_LEVELS: ArrangementLevel[] = [
  {
    id: 'arr-level-1',
    title: 'Level 1: Warm-to-Cool Spectrum',
    difficulty: 'Standard',
    description: 'Arrange 6 movable tiles smoothly from terracotta-coral on the left to teal-slate on the right.',
    startAnchor: { color: '#C85A44', label: 'Start Anchor (Coral)' },
    endAnchor: { color: '#3B7A8C', label: 'End Anchor (Teal)' },
    referenceSequence: [
      '#C67346',
      '#BF8E4B',
      '#B0A654',
      '#8EAD60',
      '#67A173',
      '#488F84',
    ],
    seed: 501,
  },
  {
    id: 'arr-level-2',
    title: 'Level 2: Red-Green Confusion Axis',
    difficulty: 'Intermediate',
    description: 'Arrange 8 subtle desaturated tiles smoothly from muted rose-mauve to sage-olive.',
    startAnchor: { color: '#B0616A', label: 'Start Anchor (Rose)' },
    endAnchor: { color: '#5F8C6A', label: 'End Anchor (Sage)' },
    referenceSequence: [
      '#AD6A68',
      '#A67465',
      '#9E7D63',
      '#948463',
      '#898964',
      '#7E8C66',
      '#728E68',
      '#688D69',
    ],
    seed: 602,
  },
  {
    id: 'arr-level-3',
    title: 'Level 3: Blue-Yellow & Spectral Subtlety',
    difficulty: 'Advanced',
    description: 'Arrange 8 low-chroma tiles smoothly from cerulean-blue through periwinkle to warm ochre.',
    startAnchor: { color: '#4E7AA8', label: 'Start Anchor (Cerulean)' },
    endAnchor: { color: '#B39856', label: 'End Anchor (Ochre)' },
    referenceSequence: [
      '#5B79A4',
      '#6A789F',
      '#7B7998',
      '#8C7E8E',
      '#998482',
      '#A38B75',
      '#AB9168',
      '#B0955E',
    ],
    seed: 703,
  },
];
