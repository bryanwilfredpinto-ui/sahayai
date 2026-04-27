// ═══════════════════════════════════════════════════════════════
// routes/bangla/matcher.js
// Pure scoring function: user query → (best Q&A, confidence).
// No I/O. No side effects. Easy to unit test.
// ═══════════════════════════════════════════════════════════════

/**
 * Score a single Q&A pair against a user query.
 * - Exact example match → confidence ≈ 0.95+
 * - Keyword match → proportional to how many keywords matched
 * - No match → 0
 */
function scorePair(userQuery, pair) {
  const q = userQuery.toLowerCase();

  // Exact example match → near-perfect
  for (const ex of (pair.q_examples || [])) {
    if (q === ex.toLowerCase() || q.includes(ex.toLowerCase())) {
      return Math.min(0.98, (pair.confidence_base || 0.9) + 0.05);
    }
  }

  // Keyword match
  const kws = pair.q_keywords || [];
  if (kws.length === 0) return 0;
  let matched = 0;
  for (const kw of kws) {
    if (q.includes(kw.toLowerCase())) matched++;
  }
  if (matched === 0) return 0;
  return (matched / kws.length) * (pair.confidence_base || 0.85);
}

/**
 * Walk the brain. Return the best match.
 */
function findBest(userQuery, brain) {
  if (!brain || !Array.isArray(brain.qa_pairs)) return { confidence: 0, qa: null };
  let best = { confidence: 0, qa: null };
  for (const pair of brain.qa_pairs) {
    const s = scorePair(userQuery, pair);
    if (s > best.confidence) best = { confidence: s, qa: pair };
  }
  return best;
}

module.exports = { scorePair, findBest };
