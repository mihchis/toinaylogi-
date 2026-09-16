import { setTimeout as sleep } from 'node:timers/promises';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { SNAPSHOT_SCHEMA_VERSION, type ActressSnapshot } from '@/lib/actresses';
import { fetchHtml, fetchImage, mapLimit, safeImageUrl } from './fetch';
import { createAvBaseEnricher, mergeAvBaseProfile } from './avbase';
import { createMinnanoAvEnricher, mergeMinnanoAvProfile } from './minnano-av';
import {
  parseActressProfile,
  parseMovieActressUrls,
  parseRankingPage,
  type RankedMovie,
} from './parser';
import {
  assignTiers,
  profilesWithImages,
  type ProfileWithMovies,
} from './scoring';
import { makeStaging, publishSnapshot, takeLock, writeStatus } from './store';

const rankingUrl = (page: number, orderby = 'views-monthly') =>
  page === 1
    ? `https://jav.guru/?s=&orderby=${orderby}&order=DESC&category_name=jav`
    : `https://jav.guru/page/${page}/?s=&orderby=${orderby}&order=DESC&category_name=jav`;
const extensionFor = (contentType: string) =>
  contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';

export async function refreshActressData(force = false) {
  const release = await takeLock();
  if (!release) return false;
  let staging = '';
  try {
    await writeStatus({
      state: 'refreshing',
      message: 'Fetching ranking pages',
    });
    const rankingPages: RankedMovie[][] = [];
    let nextRank = 1;
    for (const orderby of ['views-monthly', 'views-all']) {
      for (const page of [1, 2, 3, 4, 5]) {
        try {
          const movies = parseRankingPage(
            await fetchHtml(rankingUrl(page, orderby)),
            nextRank,
          );
          rankingPages.push(movies);
          nextRank += movies.length;
          await sleep(500);
        } catch (err) {
          console.warn(`[jav-crawler] Ranking ${orderby} p${page} skipped:`, err);
        }
      }
    }
    const discovered = rankingPages.flat();
    if (discovered.length < 45)
      throw new Error(`Incomplete ranking: ${discovered.length} cards`);
    const uniqueMovies = [
      ...discovered
        .reduce((movies, movie) => {
          const existing = movies.get(movie.url);
          if (!existing || movie.rank < existing.rank)
            movies.set(movie.url, movie);
          return movies;
        }, new Map<string, RankedMovie>())
        .values(),
    ];
    await writeStatus({
      state: 'refreshing',
      message: `Reading ${uniqueMovies.length} movie pages`,
    });
    const movieActresses = await mapLimit(uniqueMovies, 3, async (movie) => {
      try {
        const html = await fetchHtml(movie.url);
        return {
          movie,
          actressUrls: parseMovieActressUrls(html),
        };
      } catch (err) {
        console.warn(`[jav-crawler] Movie fetch skipped ${movie.url}:`, err);
        return { movie, actressUrls: [] };
      }
    });
    const actressesToMovies = new Map<string, RankedMovie[]>();
    for (const { movie, actressUrls } of movieActresses) {
      for (const actressUrl of actressUrls) {
        const existing = actressesToMovies.get(actressUrl) ?? [];
        existing.push(movie);
        actressesToMovies.set(actressUrl, existing);
      }
    }
    if (!actressesToMovies.size) throw new Error('No actresses discovered');
    const snapshotId = `${new Date().toISOString().replace(/[:.]/g, '-').toLowerCase()}-${randomUUID().slice(0, 8)}`;
    staging = await makeStaging(snapshotId);
    await writeStatus({
      state: 'refreshing',
      message: `Reading ${actressesToMovies.size} actress profiles`,
    });
    const avbase = createAvBaseEnricher();
    const minnano = createMinnanoAvEnricher();
    const rawProfiles = await mapLimit(
      [...actressesToMovies.entries()],
      3,
      async ([sourceUrl, movies]) => {
        try {
          const javProfile = parseActressProfile(
            await fetchHtml(sourceUrl),
            sourceUrl,
          );
          const enriched = await avbase.lookup(javProfile);
          let profile =
            enriched.kind === 'matched'
              ? mergeAvBaseProfile(javProfile, enriched.profile, enriched.url)
              : javProfile;
          if (enriched.kind === 'unavailable' || enriched.kind === 'malformed')
            console.warn(`[jav-crawler] AvBase: ${enriched.message}`);

          const minnanoEnriched = await minnano.lookup(profile);
          if (minnanoEnriched.kind === 'matched') {
            profile = mergeMinnanoAvProfile(
              profile,
              minnanoEnriched.profile,
              minnanoEnriched.url,
            );
          } else if (minnanoEnriched.kind === 'unavailable') {
            console.warn(`[jav-crawler] Minnano-AV: ${minnanoEnriched.message}`);
          }

          const imageUrls = [...new Set([profile.imageUrl, javProfile.imageUrl])]
            .filter((value): value is string => typeof value === 'string')
            .map(safeImageUrl)
            .filter((value): value is URL => Boolean(value));
          for (const image of imageUrls) {
            try {
              const download = await fetchImage(image.href);
              const filename = `${profile.id}.${extensionFor(download.contentType)}`;
              await writeFile(join(staging, 'images', filename), download.bytes);
              return {
                ...profile,
                movies,
                imagePath: `/actress-cache/snapshots/${snapshotId}/images/${filename}`,
              } satisfies ProfileWithMovies;
            } catch (error) {
              console.warn(
                `[jav-crawler] Skipping image for ${profile.id}: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }
          return { ...profile, movies } satisfies ProfileWithMovies;
        } catch (err) {
          console.warn(`[jav-crawler] Actress profile failed ${sourceUrl}:`, err);
          return null;
        }
      },
    );
    const profiles = rawProfiles.filter((p): p is ProfileWithMovies => Boolean(p));
    const actresses = assignTiers(profilesWithImages(profiles), discovered.length).map(
      (item) => ({
        ...item,
        publicName: item.name,
      }),
    );
    if (actresses.length < 5) throw new Error('Too few valid actresses');
    const snapshot: ActressSnapshot = {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      snapshotId,
      createdAt: new Date().toISOString(),
      source: {
        url: 'https://jav.guru/?s=&orderby=views-monthly&order=DESC&category_name=jav',
        orderBy: 'views-monthly',
        category: 'jav',
        pages: 10,
        listEntries: discovered.length,
        uniqueMovies: uniqueMovies.length,
        enrichment: avbase.stats,
      },
      actresses,
    };
    await writeFile(
      join(staging, 'snapshot.json'),
      JSON.stringify(snapshot),
      'utf8',
    );
    await publishSnapshot(snapshot, staging);
    staging = '';
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[jav-crawler]', message);
    try {
      await writeStatus({ state: 'error', message: message.slice(0, 280) });
    } catch {}
    return false;
  } finally {
    try {
      if (staging) await rm(staging, { recursive: true, force: true });
    } finally {
      await release();
    }
  }
}
