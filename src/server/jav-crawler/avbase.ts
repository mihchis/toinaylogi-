import { Impit } from 'impit';
import type { SocialLabel, SocialLink } from '@/lib/actresses';
import type { ParsedProfile } from './parser';

const client = new Impit({ browser: 'chrome', timeout: 20_000 });
const MAX_HTML_BYTES = 2_000_000;
const MAX_CANDIDATES = 5;

export type AvBaseProfile = {
  name: string;
  ruby?: string;
  birthday?: string;
  heightCm?: number;
  bustCm?: number;
  waistCm?: number;
  hipCm?: number;
  cup?: string;
  hobby?: string;
  hometown?: string;
  bloodType?: string;
  avatarUrl?: string;
  socialLinks: SocialLink[];
  wikipediaUrl?: string;
  totalWorks?: number;
};
export type AvBaseLookup =
  | { kind: 'matched'; profile: AvBaseProfile; url: string }
  | { kind: 'not-found' }
  | { kind: 'unavailable'; message: string }
  | { kind: 'malformed'; message: string };
export type AvBaseEnrichmentStats = {
  provider: 'avbase';
  attempted: number;
  matched: number;
  skipped: number;
  blocked: number;
};

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number) =>
  typeof value === 'string' &&
  value.trim() &&
  value.length <= max &&
  !/[\x00-\x1f\x7f]/.test(value)
    ? value.trim().normalize('NFC')
    : undefined;
const wholeNumber = (value: unknown, min: number, max: number) => {
  if (typeof value === 'number' && Number.isSafeInteger(value))
    return value >= min && value <= max ? value : undefined;
  const raw = text(value, 8);
  return raw && /^\d+$/.test(raw) && Number(raw) >= min && Number(raw) <= max
    ? Number(raw)
    : undefined;
};
const isoDate = (value: unknown) => {
  const date = text(value, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? date
    : undefined;
};

function socialUrl(sns: SocialLabel, handle: string) {
  switch (sns) {
    case 'X':
      return `https://x.com/${handle}`;
    case 'Instagram':
      return `https://www.instagram.com/${handle}`;
    case 'TikTok':
      return `https://www.tiktok.com/@${handle}`;
  }
}
function parseSocials(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  const links: SocialLink[] = [];
  const known = new Set<string>();
  for (const item of value.slice(0, 16)) {
    if (!isRecord(item)) continue;
    const rawPlatform = text(item.sns, 20)?.toLowerCase();
    const label =
      rawPlatform === 'twitter' || rawPlatform === 'x'
        ? 'X'
        : rawPlatform === 'instagram'
          ? 'Instagram'
          : rawPlatform === 'tiktok'
            ? 'TikTok'
            : undefined;
    const handle = text(item.id, 100)?.replace(/^@/, '');
    if (!label || !handle || !/^[a-zA-Z0-9._-]+$/.test(handle)) continue;
    const url = socialUrl(label, handle);
    if (!known.has(url)) {
      known.add(url);
      links.push({ label, url, handle });
    }
    if (links.length === 8) break;
  }
  return links;
}

function nextData(html: string): unknown {
  const match = html.match(
    /<script\s+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match?.[1]) throw new Error('AvBase __NEXT_DATA__ missing');
  return JSON.parse(match[1]);
}

export function parseAvBaseProfile(html: string): AvBaseProfile {
  const root = nextData(html);
  if (
    !isRecord(root) ||
    !isRecord(root.props) ||
    !isRecord(root.props.pageProps)
  )
    throw new Error('AvBase pageProps missing');
  const pageProps = root.props.pageProps;
  if (!isRecord(pageProps.talent)) throw new Error('AvBase talent missing');
  const talent = pageProps.talent;
  const primary = isRecord(talent.primary) ? talent.primary : {};
  const meta = isRecord(talent.meta) ? talent.meta : {};
  const basic = isRecord(meta.basic_info) ? meta.basic_info : {};
  const name = text(primary.name, 120);
  if (!name) throw new Error('AvBase talent name missing');
  const rawCup = text(basic.cup, 10)?.toUpperCase();
  const cup = rawCup && /^[A-Z]{1,3}$/.test(rawCup) ? rawCup : undefined;
  const wikipedia = text(meta.wikipedia, 200);
  const avatarUrl = text(primary.image_url, 1_000);
  const rawTotal = wholeNumber(pageProps.total, 0, 100_000);
  const totalWorks =
    rawTotal ??
    (Array.isArray(pageProps.works) ? pageProps.works.length : undefined);
  return {
    name,
    ...(text(primary.ruby, 120) ? { ruby: text(primary.ruby, 120) } : {}),
    ...(isoDate(basic.birthday) ? { birthday: isoDate(basic.birthday) } : {}),
    ...(wholeNumber(basic.height, 100, 250)
      ? { heightCm: wholeNumber(basic.height, 100, 250) }
      : {}),
    ...(wholeNumber(basic.bust, 40, 180)
      ? { bustCm: wholeNumber(basic.bust, 40, 180) }
      : {}),
    ...(wholeNumber(basic.waist, 30, 150)
      ? { waistCm: wholeNumber(basic.waist, 30, 150) }
      : {}),
    ...(wholeNumber(basic.hip, 40, 180)
      ? { hipCm: wholeNumber(basic.hip, 40, 180) }
      : {}),
    ...(cup ? { cup } : {}),
    ...(text(basic.hobby, 300) ? { hobby: text(basic.hobby, 300) } : {}),
    ...(text(basic.prefectures, 120)
      ? { hometown: text(basic.prefectures, 120) }
      : {}),
    ...(text(basic.blood_type, 10)
      ? { bloodType: text(basic.blood_type, 10) }
      : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
    socialLinks: parseSocials(meta.sns),
    ...(wikipedia
      ? {
          wikipediaUrl: `https://ja.wikipedia.org/wiki/${encodeURIComponent(wikipedia)}`,
        }
      : {}),
    ...(totalWorks !== undefined ? { totalWorks } : {}),
  };
}

function candidates(profile: Pick<ParsedProfile, 'name' | 'aliases'>) {
  const unique = new Set<string>();
  for (const value of [profile.name, ...profile.aliases]) {
    const normalized = value.trim().normalize('NFC');
    if (normalized) unique.add(normalized);
    if (unique.size === MAX_CANDIDATES) break;
  }
  return [...unique];
}

export function mergeAvBaseProfile(
  base: ParsedProfile,
  avbase: AvBaseProfile,
  avBaseUrl: string,
): ParsedProfile {
  const normalizeUrl = (url: string) =>
    url.trim().toLowerCase().replace(/\/+$/, '');
  const socialLinks = [...avbase.socialLinks, ...base.socialLinks].filter(
    (link, index, all) =>
      all.findIndex(
        (other) =>
          other.label === link.label &&
          normalizeUrl(other.url) === normalizeUrl(link.url),
      ) === index,
  );
  return {
    ...base,
    nativeName: avbase.name,
    nameReading: avbase.ruby,
    birthDate: avbase.birthday,
    cup: avbase.cup ?? base.cup,
    heightCm: avbase.heightCm ?? base.heightCm,
    bustCm: avbase.bustCm,
    waistCm: avbase.waistCm,
    hipCm: avbase.hipCm,
    bloodType: avbase.bloodType,
    hometown: avbase.hometown,
    hobby: avbase.hobby,
    videoCount: avbase.totalWorks ?? base.videoCount,
    imageUrl: avbase.avatarUrl ?? base.imageUrl,
    socialLinks: socialLinks.slice(0, 8),
    avBaseUrl,
    wikipediaUrl: avbase.wikipediaUrl,
  };
}

export function createAvBaseEnricher() {
  const stats: AvBaseEnrichmentStats = {
    provider: 'avbase',
    attempted: 0,
    matched: 0,
    skipped: 0,
    blocked: 0,
  };
  let unavailable = false;

  const lookup = async (
    profile: Pick<ParsedProfile, 'name' | 'aliases'>,
  ): Promise<AvBaseLookup> => {
    if (unavailable) {
      stats.skipped++;
      return { kind: 'unavailable', message: 'AvBase lookup circuit is open' };
    }
    for (const candidate of candidates(profile)) {
      const url = `https://www.avbase.net/talents/${encodeURIComponent(candidate)}`;
      stats.attempted++;
      try {
        const response = await client.fetch(url, {
          headers: {
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
          },
        });
        if (response.status === 404) continue;
        if (!response.ok) {
          const message = `AvBase HTTP ${response.status}`;
          if (
            response.status === 403 ||
            response.status === 429 ||
            response.status >= 500
          ) {
            unavailable = true;
            stats.blocked++;
            return { kind: 'unavailable', message };
          }
          stats.skipped++;
          return { kind: 'unavailable', message };
        }
        const contentType = response.headers.get('content-type') ?? '';
        if (!/^text\/html\b/i.test(contentType)) {
          unavailable = true;
          stats.blocked++;
          return {
            kind: 'malformed',
            message: 'AvBase returned non-HTML content',
          };
        }
        const length = Number(response.headers.get('content-length') ?? '0');
        if (length > MAX_HTML_BYTES) {
          stats.skipped++;
          return { kind: 'malformed', message: 'AvBase response exceeds 2 MB' };
        }
        const bytes = await response.bytes();
        if (bytes.byteLength > MAX_HTML_BYTES) {
          stats.skipped++;
          return { kind: 'malformed', message: 'AvBase response exceeds 2 MB' };
        }
        try {
          const parsed = parseAvBaseProfile(new TextDecoder().decode(bytes));
          stats.matched++;
          return { kind: 'matched', profile: parsed, url };
        } catch (error) {
          unavailable = true;
          stats.blocked++;
          return {
            kind: 'malformed',
            message: error instanceof Error ? error.message : String(error),
          };
        }
      } catch (error) {
        unavailable = true;
        stats.blocked++;
        return {
          kind: 'unavailable',
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }
    stats.skipped++;
    return { kind: 'not-found' };
  };

  return { lookup, stats };
}
