// =============================================================
//  El Atlas — Region taxonomy and palette
// =============================================================
//
// Custom 10-region schema (no OWID). Used by every issue.
// Edit here to change the palette globally.

const REGION_ORDER = [
  'Latin America',
  'Caribbean',
  'North America, Australia & New Zealand',
  'Western Europe',
  'Eastern Europe & Central Asia',
  'East Asia',
  'Southeast Asia',
  'South Asia',
  'Middle East & North Africa',
  'Sub-Saharan Africa'
];

// Point colors on scatter; main lines on timeseries.
// Latin America carries the Atlas terracotta accent (--accent in style.css).
const REGION_COLORS = {
  'Latin America':                          '#BE5D32',
  'Caribbean':                              '#D89968',
  'North America, Australia & New Zealand': '#3E5A6E',
  'Western Europe':                         '#658499',
  'Eastern Europe & Central Asia':          '#8FA29A',
  'East Asia':                              '#C9A654',
  'Southeast Asia':                         '#A88361',
  'South Asia':                             '#8C6648',
  'Middle East & North Africa':             '#7A5A82',
  'Sub-Saharan Africa':                     '#4F7558'
};

// Rotating palette for ad-hoc country selection (timeseries spaghetti picker
// and similar). Cartographic/editorial register — Atlas of Economic Complexity
// + FT Visual Vocabulary. Distinct from the protagonist colors (terracotta
// LATAM #BE5D32, slate-blue World #3E5A6E). Avoids reds/pinks/oranges that
// would compete with the terracotta. Six colors cycle.
const SELECTED_PALETTE = [
  '#234B85',  // cobalt blue
  '#2D6A3D',  // forest green
  '#C9A227',  // gold mustard
  '#6B3D8B',  // plum
  '#2C8484',  // saturated teal
  '#7A2A3F'   // burgundy
];

// Map from short region code (used in CSS classes and per-country JSON
// payloads) to the full Atlas region name (used in REGION_ORDER, REGION_COLORS,
// and i18n keys 'reg.<full name>'). Keep both in sync.
const REGION_CODE_TO_FULL = {
  'latam':     'Latin America',
  'caribbean': 'Caribbean',
  'nAmAusNz':  'North America, Australia & New Zealand',
  'wEurope':   'Western Europe',
  'eEurope':   'Eastern Europe & Central Asia',
  'eAsia':     'East Asia',
  'seAsia':    'Southeast Asia',
  'sAsia':     'South Asia',
  'mena':      'Middle East & North Africa',
  'ssAfrica':  'Sub-Saharan Africa'
};

// Darker variants for labels: needed so country names stay legible
// over the cream plot background (FT/OWID convention).
const REGION_LABEL_COLORS = {
  'Latin America':                          '#8B3F1E',
  'Caribbean':                              '#A35E2E',
  'North America, Australia & New Zealand': '#243B4E',
  'Western Europe':                         '#3E5C72',
  'Eastern Europe & Central Asia':          '#5A6E66',
  'East Asia':                              '#8B6F1E',
  'Southeast Asia':                         '#73553A',
  'South Asia':                             '#5C3F26',
  'Middle East & North Africa':             '#4E3858',
  'Sub-Saharan Africa':                     '#2F4D38'
};
