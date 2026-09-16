import type { ActressSnapshot, Tier } from './actresses';

export type Movie = {
  id: string;
  code: string;
  title: string;
  movieUrl: string;
  coverUrl: string;
  tier: Tier;
  rank: number;
  actressNames: string[];
};

export function extractTitleFromSlug(movieUrl: string, code: string): string {
  try {
    const url = new URL(movieUrl);
    const slug = url.pathname.split('/').filter(Boolean).pop() || '';
    const parts = slug.split('-').filter((p) => p.length > 0);
    const codeParts = code.toLowerCase().split('-');
    let startIdx = 0;
    if (
      parts.length > codeParts.length &&
      codeParts.every((cp, i) => parts[i]?.toLowerCase() === cp)
    ) {
      startIdx = codeParts.length;
    }
    const titleWords = parts.slice(startIdx);
    if (titleWords.length > 0) {
      return titleWords
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  } catch {}
  return code;
}

export function buildMoviesFromSnapshot(snapshot: ActressSnapshot): Movie[] {
  const map = new Map<string, Movie>();

  for (const actress of snapshot.actresses) {
    for (const movie of actress.contributingMovies) {
      const existing = map.get(movie.code);
      if (existing) {
        if (!existing.actressNames.includes(actress.name)) {
          existing.actressNames.push(actress.name);
        }
        if (movie.rank < existing.rank) {
          existing.rank = movie.rank;
        }
      } else {
        // Assign tier based on best rank
        // Rank 1-10: Tier 4 (Special)
        // Rank 11-30: Tier 3 (Covert)
        // Rank 31-60: Tier 2 (Classified)
        // Rank 61-100: Tier 1 (Restricted)
        // Rank > 100: Tier 0 (Mil-spec)
        let tier: Tier = 0;
        if (movie.rank <= 10) tier = 4;
        else if (movie.rank <= 30) tier = 3;
        else if (movie.rank <= 60) tier = 2;
        else if (movie.rank <= 100) tier = 1;

        map.set(movie.code, {
          id: movie.code,
          code: movie.code,
          title: extractTitleFromSlug(movie.movieUrl, movie.code),
          movieUrl: movie.movieUrl,
          coverUrl: actress.imagePath, // Fallback to actress image
          tier,
          rank: movie.rank,
          actressNames: [actress.name],
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.rank - b.rank);
}
