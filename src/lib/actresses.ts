import { isFoodAliasForTier } from './food-aliases';

export const SNAPSHOT_SCHEMA_VERSION = 3 as const;
export const TIER_COUNT = 5 as const;

export type Tier = 0 | 1 | 2 | 3 | 4;
export type ContributingMovie = {
  rank: number;
  code: string;
  movieUrl: string;
};
export type Actress = {
  id: string;
  sourceUrl: string;
  name: string;
  publicName: string;
  aliases: string[];
  age?: number;
  cup?: string;
  heightCm?: number;
  videoCount?: number;
  imagePath: string;
  socialLinks: { label: 'X' | 'Instagram'; url: string }[];
  score: number;
  tier: Tier;
  bestRank: number;
  appearances: number;
  contributingMovies: ContributingMovie[];
};
export type ActressSnapshot = {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  snapshotId: string;
  createdAt: string;
  source: {
    url: string;
    orderBy: 'views-monthly';
    category: 'jav';
    pages: number;
    listEntries: number;
    uniqueMovies: number;
  };
  actresses: Actress[];
};
export type CurrentSnapshot = {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  snapshotId: string;
  snapshotPath: string;
  createdAt: string;
};
export type RefreshStatus = {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  state: 'idle' | 'refreshing' | 'error';
  updatedAt: string;
  message?: string;
  attempt?: number;
};

const origin = 'https://jav.guru';
const safeText = (value: unknown, max: number) =>
  typeof value === 'string' &&
  value.trim() &&
  value.length <= max &&
  !/[\x00-\x1f\x7f]/.test(value)
    ? value.trim().normalize('NFC')
    : null;

export function canonicalJavUrl(value: unknown, kind: 'actress' | 'movie') {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value, origin);
    if (url.protocol !== 'https:' || url.hostname !== 'jav.guru') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (kind === 'actress' && (parts.length !== 2 || parts[0] !== 'actress'))
      return null;
    if (kind === 'movie' && (!parts.length || parts[0] === 'actress'))
      return null;
    url.search = '';
    url.hash = '';
    url.pathname = `/${parts.join('/')}/`;
    return url.href;
  } catch {
    return null;
  }
}

export function isSafeLocalAsset(value: unknown) {
  return (
    typeof value === 'string' &&
    /^\/actress-cache\/snapshots\/[a-z0-9-]+\/images\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/i.test(
      value,
    )
  );
}

export function isSafeSocialLink(value: unknown) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ['x.com', 'www.instagram.com', 'instagram.com'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export function validateSnapshot(input: unknown): ActressSnapshot | null {
  if (!input || typeof input !== 'object') return null;
  const snapshot = input as Record<string, unknown>;
  if (
    snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION ||
    !safeText(snapshot.snapshotId, 80) ||
    !safeText(snapshot.createdAt, 40) ||
    !snapshot.source ||
    !Array.isArray(snapshot.actresses) ||
    !snapshot.actresses.length ||
    snapshot.actresses.length > 500
  )
    return null;
  const source = snapshot.source as Record<string, unknown>;
  if (
    source.url !==
      'https://jav.guru/?s=&orderby=views-monthly&order=DESC&category_name=jav' ||
    source.orderBy !== 'views-monthly' ||
    source.category !== 'jav' ||
    source.pages !== 3 ||
    !Number.isSafeInteger(source.listEntries) ||
    !Number.isSafeInteger(source.uniqueMovies)
  )
    return null;
  const ids = new Set<string>();
  const actresses: Actress[] = [];
  for (const item of snapshot.actresses) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const id = safeText(row.id, 100);
    const name = safeText(row.name, 120);
    const publicName = safeText(row.publicName, 120);
    const sourceUrl = canonicalJavUrl(row.sourceUrl, 'actress');
    if (
      !id ||
      ids.has(id) ||
      !name ||
      !publicName ||
      !sourceUrl ||
      !Array.isArray(row.aliases) ||
      !Array.isArray(row.socialLinks) ||
      !Array.isArray(row.contributingMovies) ||
      typeof row.score !== 'number' ||
      !Number.isFinite(row.score) ||
      typeof row.tier !== 'number' ||
      !Number.isInteger(row.tier) ||
      row.tier < 0 ||
      row.tier >= TIER_COUNT ||
      typeof row.bestRank !== 'number' ||
      !Number.isSafeInteger(row.bestRank) ||
      row.bestRank < 1 ||
      typeof row.appearances !== 'number' ||
      !Number.isSafeInteger(row.appearances) ||
      row.appearances < 1
    )
      return null;
    if (!isFoodAliasForTier(publicName, row.tier as Tier)) return null;
    const aliases = row.aliases
      .map((x) => safeText(x, 120))
      .filter(Boolean) as string[];
    if (aliases.length > 20 || aliases.some((x) => x === name)) return null;
    const socialLinks = row.socialLinks.map((link) => {
      if (!link || typeof link !== 'object') return null;
      const social = link as Record<string, unknown>;
      return (social.label === 'X' || social.label === 'Instagram') &&
        isSafeSocialLink(social.url)
        ? { label: social.label, url: social.url }
        : null;
    });
    if (socialLinks.some((x) => !x) || socialLinks.length > 2) return null;
    const contributingMovies = row.contributingMovies.map((movie) => {
      if (!movie || typeof movie !== 'object') return null;
      const parsed = movie as Record<string, unknown>;
      const code = safeText(parsed.code, 80);
      const movieUrl = canonicalJavUrl(parsed.movieUrl, 'movie');
      return typeof parsed.rank === 'number' &&
        Number.isSafeInteger(parsed.rank) &&
        parsed.rank >= 1 &&
        code &&
        movieUrl
        ? { rank: parsed.rank, code, movieUrl }
        : null;
    });
    if (
      !contributingMovies.length ||
      contributingMovies.some((x) => !x) ||
      contributingMovies.length > 60
    )
      return null;
    const optionalNumber = (key: string, min: number, max: number) =>
      row[key] === undefined
        ? undefined
        : Number.isSafeInteger(row[key]) &&
            (row[key] as number) >= min &&
            (row[key] as number) <= max
          ? (row[key] as number)
          : null;
    const age = optionalNumber('age', 18, 100);
    const heightCm = optionalNumber('heightCm', 100, 250);
    const videoCount = optionalNumber('videoCount', 0, 100_000);
    const cup = row.cup === undefined ? undefined : safeText(row.cup, 20);
    if (
      age === null ||
      heightCm === null ||
      videoCount === null ||
      cup === null
    )
      return null;
    if (!isSafeLocalAsset(row.imagePath)) return null;
    ids.add(id);
    actresses.push({
      id,
      sourceUrl,
      name,
      publicName,
      aliases,
      age,
      cup,
      heightCm,
      videoCount,
      imagePath: row.imagePath as string,
      socialLinks: socialLinks as Actress['socialLinks'],
      score: row.score as number,
      tier: row.tier as Tier,
      bestRank: row.bestRank as number,
      appearances: row.appearances as number,
      contributingMovies: contributingMovies as ContributingMovie[],
    });
  }
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    snapshotId: snapshot.snapshotId as string,
    createdAt: snapshot.createdAt as string,
    source: source as ActressSnapshot['source'],
    actresses,
  };
}

export function validateCurrent(input: unknown): CurrentSnapshot | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  const snapshotId = safeText(value.snapshotId, 80);
  const snapshotPath =
    typeof value.snapshotPath === 'string' &&
    /^\/actress-cache\/snapshots\/[a-z0-9-]+\/snapshot\.json$/i.test(
      value.snapshotPath,
    )
      ? value.snapshotPath
      : null;
  return value.schemaVersion === SNAPSHOT_SCHEMA_VERSION &&
    snapshotId &&
    snapshotPath &&
    safeText(value.createdAt, 40)
    ? {
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        snapshotId,
        snapshotPath,
        createdAt: value.createdAt as string,
      }
    : null;
}

export const tierNames = [
  'MIL-SPEC',
  'RESTRICTED',
  'CLASSIFIED',
  'COVERT',
  '★ SPECIAL ITEM',
] as const;
