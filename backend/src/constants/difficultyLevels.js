// Trip and activity difficulty.
//
// THE ONE REAL MISMATCH IN THE FRONTEND DATA, so read this before changing it.
//
// The seed stores two different casings for the same concept:
//
//   packages   "Challenging", "Strenuous and technical", "Easy to Moderate"
//   activities "challenging", "extreme", "moderate"
//
// The frontend already reconciles them at read time — `difficultyDetails()` in
// frontend/src/lib/displayLabels.js lowercases the value and collapses
// separators before looking it up. Its lookup keys are therefore the real
// canonical vocabulary, and they are what this list holds.
//
// Storing "Strenuous and technical" would be storing a presentation label, so
// the schema normalises on write instead (see normaliseDifficulty). The
// transformation is lossless: difficultyDetails() renders both forms
// identically. It is recorded in docs/FRONTEND_FIELD_MAPPING.md.
export const DIFFICULTY_LEVELS = Object.freeze([
  'easy',
  'easy to moderate',
  'moderate',
  'challenging',
  'strenuous',
  'strenuous and technical',
  'extreme',
])

// Matches the frontend's own normalisation exactly.
export function normaliseDifficulty(value) {
  if (typeof value !== 'string') return value
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}
