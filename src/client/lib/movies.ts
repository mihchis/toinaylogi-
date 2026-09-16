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
  studio?: string;
  label?: string;
  releaseDate?: string;
  director?: string;
  tags?: string[];
  actors?: string[];
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
    for (const movie of actress.contributingMovies as any[]) {
      const existing = map.get(movie.code);
      if (existing) {
        if (!existing.actressNames.includes(actress.name)) {
          existing.actressNames.push(actress.name);
        }
        if (movie.rank < existing.rank) {
          existing.rank = movie.rank;
        }
        // Cập nhật thêm nếu movie này có coverUrl mà existing chưa có
        if (movie.coverUrl && !existing.coverUrl.startsWith('http')) {
          existing.coverUrl = movie.coverUrl;
        }
        if (movie.title && existing.title === existing.code) {
          existing.title = movie.title;
        }
        if (movie.studio && !existing.studio) existing.studio = movie.studio;
        if (movie.releaseDate && !existing.releaseDate) existing.releaseDate = movie.releaseDate;
        if (movie.director && !existing.director) existing.director = movie.director;
        if (movie.label && !existing.label) existing.label = movie.label;
        if (movie.tags?.length && !existing.tags?.length) existing.tags = movie.tags;
        if (movie.actors?.length && !existing.actors?.length) existing.actors = movie.actors;
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
          title: movie.title || extractTitleFromSlug(movie.movieUrl, movie.code),
          movieUrl: movie.movieUrl,
          coverUrl: movie.coverUrl || actress.imagePath,
          tier,
          rank: movie.rank,
          actressNames: [actress.name],
          studio: movie.studio,
          label: movie.label,
          releaseDate: movie.releaseDate,
          director: movie.director,
          tags: movie.tags || [],
          actors: movie.actors || [],
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.rank - b.rank);
}
