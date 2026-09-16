import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SNAPSHOT_PATH = 'public/actress-cache/snapshots/2026-09-16t11-15-39-437z-7bd40838/snapshot.json';
const OUTPUT_PATH = 'public/actress-cache/movies-metadata.json';

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8'));

// Thu thập toàn bộ phim unique
const movieMap = new Map();
for (const actress of snapshot.actresses) {
  for (const m of actress.contributingMovies) {
    if (!movieMap.has(m.code)) {
      movieMap.set(m.code, {
        code: m.code,
        movieUrl: m.movieUrl,
        rank: m.rank,
        actresses: [actress.name],
      });
    } else {
      const existing = movieMap.get(m.code);
      if (!existing.actresses.includes(actress.name)) {
        existing.actresses.push(actress.name);
      }
      if (m.rank < existing.rank) existing.rank = m.rank;
    }
  }
}

console.log(`Đang cào dữ liệu chi tiết cho ${movieMap.size} bộ phim...`);

const movies = [...movieMap.values()];
const results = {};

// Helper mapLimit
async function mapLimit(items, limit, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        console.error(`Lỗi tại item ${i}:`, err.message);
        results[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function fetchMovieDetail(m, idx) {
  try {
    const res = await fetch(m.movieUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const cover = $('.large-screenimg img').attr('src') || '';
    const title = $('.large-screenimg img').attr('alt') || '';
    let studio = '';
    let releaseDate = '';
    let director = '';
    let label = '';
    const tags = [];
    const actors = [];
    const extraActresses = [];

    $('.infoleft li').each((_, el) => {
      const text = $(el).text().trim();
      if (text.startsWith('Studio:')) studio = text.replace('Studio:', '').trim();
      else if (text.startsWith('Release Date:')) releaseDate = text.replace('Release Date:', '').trim();
      else if (text.startsWith('Director:')) director = text.replace('Director:', '').trim();
      else if (text.startsWith('Label:')) label = text.replace('Label:', '').trim();
      else if (text.startsWith('Tags:')) {
        tags.push(...text.replace('Tags:', '').split(',').map(s => s.trim()).filter(Boolean));
      } else if (text.startsWith('Actor:')) {
        actors.push(...text.replace('Actor:', '').split(',').map(s => s.trim()).filter(Boolean));
      } else if (text.startsWith('Actress:')) {
        extraActresses.push(...text.replace('Actress:', '').split(',').map(s => s.trim()).filter(Boolean));
      }
    });

    const combinedActresses = [...new Set([...m.actresses, ...extraActresses])];

    const data = {
      code: m.code,
      title: title || m.code,
      coverUrl: cover,
      studio,
      label,
      releaseDate,
      director,
      tags,
      actors,
      actresses: combinedActresses,
      movieUrl: m.movieUrl,
      rank: m.rank,
    };

    results[m.code] = data;
    if ((idx + 1) % 25 === 0 || idx + 1 === movies.length) {
      console.log(`Tiến độ: ${idx + 1}/${movies.length} phim hoàn thành`);
    }
    return data;
  } catch (err) {
    console.warn(`Bỏ qua ${m.code}: ${err.message}`);
    results[m.code] = {
      code: m.code,
      title: m.code,
      coverUrl: '',
      studio: '',
      releaseDate: '',
      director: '',
      tags: [],
      actors: [],
      actresses: m.actresses,
      movieUrl: m.movieUrl,
      rank: m.rank,
    };
    return results[m.code];
  }
}

async function main() {
  await mapLimit(movies, 10, fetchMovieDetail);
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Đã ghi thành công dữ liệu metadata vào ${OUTPUT_PATH}!`);

  // Cập nhật luôn vào snapshot.json nếu muốn
  let updatedCount = 0;
  for (const actress of snapshot.actresses) {
    for (const m of actress.contributingMovies) {
      const meta = results[m.code];
      if (meta) {
        m.coverUrl = meta.coverUrl || '';
        m.title = meta.title || m.code;
        m.studio = meta.studio || '';
        m.releaseDate = meta.releaseDate || '';
        m.director = meta.director || '';
        m.label = meta.label || '';
        m.tags = meta.tags || [];
        m.actors = meta.actors || [];
        updatedCount++;
      }
    }
  }
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot), 'utf-8');
  console.log(`Đã cập nhật ${updatedCount} movie references trong snapshot.json!`);
}

main().catch(console.error);
