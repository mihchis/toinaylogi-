import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseActressProfile,
  parseMovieActressUrls,
  parseRankingPage,
} from '../src/server/jav-crawler/parser';
import {
  assignTiers,
  profilesWithImages,
} from '../src/server/jav-crawler/scoring';
import {
  SNAPSHOT_SCHEMA_VERSION,
  validateSnapshot,
} from '../src/lib/actresses';

const html = readFileSync(
  new URL('./fixtures/xxx-guru.html', import.meta.url),
  'utf8',
);
test('synthetic XXX.Guru fixture locks expected parser contract', () => {
  const movies = parseRankingPage(html, 1);
  assert.equal(movies.length, 15);
  assert.deepEqual(parseMovieActressUrls(html), [
    'https://jav.guru/actress/demo-star/',
  ]);
  const profile = parseActressProfile(
    html,
    'https://jav.guru/actress/demo-star/',
  );
  assert.equal(profile.name, 'Demo Star');
  assert.equal(profile.age, 24);
  assert.equal(profile.socialLinks[0]?.label, 'X');
});
test('tier scorer makes top performers rare and keeps each tier populated', () => {
  const data = Array.from({ length: 10 }, (_, index) => ({
    id: `star-${index}`,
    sourceUrl: `https://jav.guru/actress/star-${index}/`,
    name: `Star ${index}`,
    aliases: [],
    socialLinks: [],
    imagePath: `/actress-cache/snapshots/demo/images/star-${index}.jpg`,
    movies: [
      {
        rank: index + 1,
        url: `https://jav.guru/movie-${index}/`,
        code: `T-${index}`,
      },
    ],
  }));
  const ranked = assignTiers(data, data.length);
  assert.equal(new Set(ranked.map((item) => item.tier)).size, 5);
  assert.equal(ranked.find((item) => item.id === 'star-0')?.tier, 4);
  assert.ok(ranked.every((item) => item.imagePath));
});
test('crawler scorer excludes profiles without a downloaded image', () => {
  const profiles = [
    {
      id: 'with-image',
      sourceUrl: 'https://jav.guru/actress/with-image/',
      name: 'With Image',
      aliases: [],
      socialLinks: [],
      imagePath: '/actress-cache/snapshots/demo/images/with-image.jpg',
      movies: [
        { rank: 1, url: 'https://jav.guru/demo-movie/', code: 'DEMO-1' },
      ],
    },
    {
      id: 'without-image',
      sourceUrl: 'https://jav.guru/actress/without-image/',
      name: 'Without Image',
      aliases: [],
      socialLinks: [],
      movies: [
        { rank: 2, url: 'https://jav.guru/demo-movie-2/', code: 'DEMO-2' },
      ],
    },
  ];
  const imageBacked = profilesWithImages(profiles);
  assert.deepEqual(
    imageBacked.map((profile) => profile.id),
    ['with-image'],
  );
  assert.equal(assignTiers(imageBacked, 2)[0]?.id, 'with-image');
});
test('snapshot schema requires a same-tier food alias and an image path', () => {
  const snapshot = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    snapshotId: 'demo-snapshot',
    createdAt: '2026-09-11T00:00:00.000Z',
    source: {
      url: 'https://jav.guru/?s=&orderby=views-monthly&order=DESC&category_name=jav',
      orderBy: 'views-monthly',
      category: 'jav',
      pages: 3,
      listEntries: 45,
      uniqueMovies: 45,
      enrichment: {
        provider: 'avbase',
        attempted: 1,
        matched: 1,
        skipped: 0,
        blocked: 0,
      },
    },
    actresses: [
      {
        id: 'demo-star',
        sourceUrl: 'https://jav.guru/actress/demo-star/',
        name: 'Demo Star',
        publicName: 'Bánh mì',
        aliases: [],
        imagePath:
          '/actress-cache/snapshots/demo-snapshot/images/demo-star.jpg',
        socialLinks: [],
        score: 45,
        tier: 0,
        bestRank: 1,
        appearances: 1,
        contributingMovies: [
          {
            rank: 1,
            code: 'DEMO-1',
            movieUrl: 'https://jav.guru/demo-movie/',
          },
        ],
      },
    ],
  };
  assert.ok(validateSnapshot(snapshot));
  const { imagePath: _, ...withoutImage } = snapshot.actresses[0]!;
  assert.equal(
    validateSnapshot({
      ...snapshot,
      actresses: [withoutImage],
    }),
    null,
  );
  assert.equal(
    validateSnapshot({
      ...snapshot,
      actresses: [{ ...snapshot.actresses[0], publicName: 'Pizza' }],
    }),
    null,
  );
  assert.equal(
    validateSnapshot({
      ...snapshot,
      actresses: [
        {
          ...snapshot.actresses[0],
          socialLinks: [
            { label: 'TikTok', url: 'https://example.com/not-a-profile' },
          ],
        },
      ],
    }),
    null,
  );
  const legacy = validateSnapshot({
    ...snapshot,
    schemaVersion: 3,
    source: {
      ...snapshot.source,
      enrichment: undefined,
    },
  });
  assert.equal(legacy?.schemaVersion, SNAPSHOT_SCHEMA_VERSION);
  assert.deepEqual(legacy?.source.enrichment, {
    provider: 'avbase',
    attempted: 0,
    matched: 0,
    skipped: 0,
    blocked: 0,
  });
});
