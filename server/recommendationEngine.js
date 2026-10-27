/**
 * Da Movies Priority-Aware Recommendation Engine
 * 
 * Rules:
 * 1. Filter modes:
 *    - 'OFF': Ignored completely.
 *    - 'REQUIRED': Strict constraint. Movie MUST satisfy condition. Missing data fails condition.
 *    - 'PREFERRED': Never excludes movie. Contributes to Da Score (0-100) based on priority weight.
 * 2. Preferred weights:
 *    - 'low' -> 1
 *    - 'medium' -> 2
 *    - 'high' -> 4
 * 3. Deterministic scoring and tie-breaking.
 * 4. Transparent, explainable breakdown per movie.
 */

// Equal weight for all preferred filters
const PREFERRED_WEIGHT = 1;

// Evaluate numeric filter against value given operator
function evaluateNumeric(value, filter) {
  if (value === null || value === undefined || isNaN(value)) {
    return { matches: false, isUnknown: true, score: 0 };
  }
  const op = filter.operator || '<=';
  const val = Number(value);
  const target1 = Number(filter.value);
  const target2 = Number(filter.valueMax);

  switch (op) {
    case '<=': {
      if (val <= target1) return { matches: true, isUnknown: false, score: 1.0 };
      // Soft scoring for preferred: gradual drop-off within 20% tolerance
      const diff = val - target1;
      const tolerance = Math.max(target1 * 0.25, 1);
      const score = Math.max(0, 1.0 - (diff / tolerance));
      return { matches: false, isUnknown: false, score };
    }
    case '>=': {
      if (val >= target1) return { matches: true, isUnknown: false, score: 1.0 };
      const diff = target1 - val;
      const tolerance = Math.max(target1 * 0.25, 1);
      const score = Math.max(0, 1.0 - (diff / tolerance));
      return { matches: false, isUnknown: false, score };
    }
    case 'between': {
      const min = Math.min(target1, target2 || target1);
      const max = Math.max(target1, target2 || target1);
      if (val >= min && val <= max) return { matches: true, isUnknown: false, score: 1.0 };
      const dist = val < min ? (min - val) : (val - max);
      const range = Math.max(max - min, 5);
      const score = Math.max(0, 1.0 - (dist / range));
      return { matches: false, isUnknown: false, score };
    }
    default:
      return { matches: val === target1, isUnknown: false, score: val === target1 ? 1.0 : 0 };
  }
}

// Evaluate genre filter
function evaluateGenre(movie, filter) {
  if (!filter.genres || filter.genres.length === 0) return { matches: true, isUnknown: false, score: 1 };
  if (!movie.genres || movie.genres.length === 0) return { matches: false, isUnknown: true, score: 0 };

  const movieGenres = movie.genres.map(g => g.toLowerCase());
  const targetGenres = filter.genres.map(g => g.toLowerCase());

  // Count how many target genres match
  const matchesCount = targetGenres.filter(tg => movieGenres.includes(tg)).length;
  
  if (filter.matchAll) {
    const allMatched = matchesCount === targetGenres.length;
    return {
      matches: allMatched,
      isUnknown: false,
      score: targetGenres.length > 0 ? (matchesCount / targetGenres.length) : 1
    };
  } else {
    // Any target genre matches
    const hasMatch = matchesCount > 0;
    return {
      matches: hasMatch,
      isUnknown: false,
      score: hasMatch ? (matchesCount / targetGenres.length) : 0
    };
  }
}

// Evaluate director filter
function evaluateDirector(movie, filter) {
  if (!filter.personName || filter.personName.trim() === '') return { matches: true, isUnknown: false, score: 1 };
  if (!movie.director) return { matches: false, isUnknown: true, score: 0 };

  const query = filter.personName.trim().toLowerCase();
  const matched = movie.director.toLowerCase().includes(query);
  return {
    matches: matched,
    isUnknown: false,
    score: matched ? 1.0 : 0
  };
}

// Evaluate streaming provider filter
function evaluateStreaming(movie, filter) {
  if (!filter.providerName || filter.providerName.trim() === '') return { matches: true, isUnknown: false, score: 1 };
  if (!movie.streaming_providers || movie.streaming_providers.length === 0) {
    return { matches: false, isUnknown: true, score: 0 };
  }

  const query = filter.providerName.trim().toLowerCase();
  const matched = movie.streaming_providers.some(prov => prov.toLowerCase().includes(query));
  return {
    matches: matched,
    isUnknown: false,
    score: matched ? 1.0 : 0
  };
}

export function rankMovies(candidates, filterConfig = {}) {
  const {
    runtime = { mode: 'OFF' },
    rating = { mode: 'OFF' },
    year = { mode: 'OFF' },
    genre = { mode: 'OFF' },
    director = { mode: 'OFF' },
    streaming = { mode: 'OFF' },
    searchQuery = ''
  } = filterConfig;

  const filtersList = [
    { key: 'runtime', label: 'Runtime', config: runtime, evalFn: (m) => evaluateNumeric(m.runtime, runtime) },
    { key: 'rating', label: 'Rating', config: rating, evalFn: (m) => evaluateNumeric(m.vote_average, rating) },
    { key: 'year', label: 'Release Year', config: year, evalFn: (m) => evaluateNumeric(m.year, year) },
    { key: 'genre', label: 'Genre', config: genre, evalFn: (m) => evaluateGenre(m, genre) },
    { key: 'director', label: 'Director', config: director, evalFn: (m) => evaluateDirector(m, director) },
    { key: 'streaming', label: 'Streaming Platform', config: streaming, evalFn: (m) => evaluateStreaming(m, streaming) }
  ];

  const requiredFilters = filtersList.filter(f => f.config.mode === 'REQUIRED');
  const preferredFilters = filtersList.filter(f => f.config.mode === 'PREFERRED');

  let passedRequiredCount = 0;
  let excludedRequiredCount = 0;
  const processedMovies = [];

  for (const movie of candidates) {
    // If title search query is provided, check title substring
    if (searchQuery && searchQuery.trim().length > 0) {
      if (!movie.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
        continue;
      }
    }

    // Step C: Apply every Required filter strictly.
    let failedRequired = null;
    for (const reqFilter of requiredFilters) {
      const result = reqFilter.evalFn(movie);
      // Missing data must NOT count as a successful match
      if (result.isUnknown || !result.matches) {
        failedRequired = {
          key: reqFilter.key,
          label: reqFilter.label,
          reason: result.isUnknown ? `Missing ${reqFilter.label} information` : `Did not meet required ${reqFilter.label}`
        };
        break;
      }
    }

    if (failedRequired) {
      excludedRequiredCount++;
      continue; // Exclude movie completely
    }

    passedRequiredCount++;

    // Step D: Score surviving movies against Preferred filters with uniform weight.
    let totalWeight = 0;
    let weightedScoreSum = 0;
    const matchedPreferences = [];
    const missedPreferences = [];
    const unknownPreferences = [];

    for (const prefFilter of preferredFilters) {
      const weight = PREFERRED_WEIGHT;
      totalWeight += weight;

      const evalRes = prefFilter.evalFn(movie);
      weightedScoreSum += weight * evalRes.score;

      if (evalRes.isUnknown) {
        unknownPreferences.push({
          key: prefFilter.key,
          label: prefFilter.label,
          detail: `Unknown or unverified ${prefFilter.label.toLowerCase()}`
        });
      } else if (evalRes.matches || evalRes.score >= 0.7) {
        matchedPreferences.push({
          key: prefFilter.key,
          label: prefFilter.label,
          score: Math.round(evalRes.score * 100)
        });
      } else {
        missedPreferences.push({
          key: prefFilter.key,
          label: prefFilter.label,
          score: Math.round(evalRes.score * 100)
        });
      }
    }

    // Calculate final Da Score (0 to 100)
    let daScore = 0;
    if (preferredFilters.length === 0) {
      // If no preferences set, base score is tied to TMDB quality (normalized out of 100)
      daScore = movie.vote_average ? Math.round(movie.vote_average * 10) : 75;
    } else if (totalWeight > 0) {
      daScore = Math.round((weightedScoreSum / totalWeight) * 100);
    }

    processedMovies.push({
      ...movie,
      daScore: Math.min(100, Math.max(0, daScore)),
      breakdown: {
        matchedPreferences,
        missedPreferences,
        unknownPreferences,
        requiredSatisfied: requiredFilters.map(f => f.label)
      }
    });
  }

  // Deterministic tie-breaking:
  // 1. Da Score (desc)
  // 2. TMDB vote_average (desc)
  // 3. TMDB vote_count (desc)
  // 4. Title (alphabetical)
  processedMovies.sort((a, b) => {
    if (b.daScore !== a.daScore) return b.daScore - a.daScore;
    const ratingA = a.vote_average || 0;
    const ratingB = b.vote_average || 0;
    if (ratingB !== ratingA) return ratingB - ratingA;
    const countA = a.vote_count || 0;
    const countB = b.vote_count || 0;
    if (countB !== countA) return countB - countA;
    return a.title.localeCompare(b.title);
  });

  return {
    results: processedMovies,
    meta: {
      totalCandidates: candidates.length,
      passedRequiredCount,
      excludedRequiredCount,
      requiredFiltersCount: requiredFilters.length,
      preferredFiltersCount: preferredFilters.length,
      isEmptyBecauseRequiredFailed: candidates.length > 0 && passedRequiredCount === 0 && requiredFilters.length > 0
    }
  };
}
