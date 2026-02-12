/**
 * Calculate Levenshtein distance between two strings.
 * Used for typo detection in Pokemon card listing titles.
 */
export function levenshteinDistance(a, b) {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use single-row optimization for memory efficiency
  let prev = new Array(lb + 1);
  let curr = new Array(lb + 1);

  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost    // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb];
}

/**
 * Calculate normalized similarity score (0-100).
 * 100 = exact match, 0 = completely different.
 */
export function similarityScore(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return Math.round((1 - dist / maxLen) * 100);
}

/**
 * Find the best match for a word among a list of correct spellings.
 * Returns null if no close match is found.
 */
export function findBestMatch(word, correctWords, maxDistance = 3) {
  let bestMatch = null;
  let bestDist = maxDistance + 1;

  const lowerWord = word.toLowerCase();

  for (const correct of correctWords) {
    const lowerCorrect = correct.toLowerCase();
    // Quick length check to skip obviously different words
    if (Math.abs(lowerWord.length - lowerCorrect.length) > maxDistance) continue;

    const dist = levenshteinDistance(lowerWord, lowerCorrect);
    if (dist > 0 && dist <= maxDistance && dist < bestDist) {
      bestDist = dist;
      bestMatch = { correct, distance: dist, similarity: similarityScore(word, correct) };
    }
  }

  return bestMatch;
}
