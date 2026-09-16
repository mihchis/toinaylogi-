'use client';

import Link from 'next/link';
import { flushSync } from 'react-dom';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Box,
  CircleHelp,
  ExternalLink,
  Film,
  Sparkles,
  Star,
  StarHalf,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { readCookie, writeCookie } from '@/lib/cookies';
import {
  chooseTiered,
  createSpinProfile,
  spinProgress,
  stopFraction,
} from '@/lib/case-mechanics';
import { type Actress } from '@/lib/actresses';
import { copy, type Language } from '@/lib/i18n';
import { useActressSnapshot } from '@/hooks/use-actress-snapshot';
import { useLocalSpinCount } from '@/hooks/use-local-spin-count';
import { useServerSpinCount } from '@/hooks/use-server-spin-count';
import { usePreferences } from '@/hooks/use-preferences';
import { eligibleActresses } from '@/lib/actress-preferences';
import { PreferencesPanel } from '@/components/preferences-panel';
import { CaseAudio } from '@/lib/case-audio';
import { TAG_VI_TO_EN } from '@/lib/tag-translations';
import { isDirectCardDialogEnabled } from '@/lib/direct-card-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useInventory } from '@/hooks/use-inventory';
import { UserMenu } from '@/components/auth/user-menu';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { InventoryDialog } from '@/components/inventory/inventory-dialog';
import { CrateSwitcher, type CrateType } from '@/components/crate/crate-switcher';
import { MovieCard } from '@/components/crate/movie-card';
import { buildMoviesFromSnapshot, type Movie } from '@/lib/movies';

const colors = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#e4ae39'];
const reelStep = 254;
const reelInitialOffset = -400;

function formatBirthDate(value: string, language: Language) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'long',
  }).format(new Date(year, month - 1, day));
}

function parseMovieInfo(movie: { rank: number; code: string; movieUrl: string }) {
  let title = '';
  try {
    const url = new URL(movie.movieUrl);
    const slug = url.pathname.split('/').filter(Boolean).pop() || '';
    const parts = slug.split('-').filter((p) => p.length > 0);
    const codeParts = movie.code.toLowerCase().split('-');
    let startIdx = 0;
    if (
      parts.length > codeParts.length &&
      codeParts.every((cp, i) => parts[i]?.toLowerCase() === cp)
    ) {
      startIdx = codeParts.length;
    }
    const titleWords = parts.slice(startIdx);
    if (titleWords.length > 0) {
      title = titleWords
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  } catch {}
  return {
    code: movie.code,
    rank: movie.rank,
    title: title || movie.code,
    searchGoogle: `https://www.google.com/search?q=${encodeURIComponent(movie.code)}`,
    sourceUrl: movie.movieUrl,
  };
}

function StarRating({
  score,
  showScore = true,
  max = 5,
}: {
  score: number;
  showScore?: boolean;
  max?: number;
}) {
  const starScore = Math.min(max, Math.max(0, score / 2));
  return (
    <div
      className="star-rating"
      title={`${score.toFixed(2)}/10 (${starScore.toFixed(2)}/${max})`}
    >
      <div className="star-icons" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          if (starScore >= i - 0.25) {
            return (
              <Star
                key={i}
                size={13}
                className="star-icon star-full"
                fill="currentColor"
                stroke="currentColor"
              />
            );
          }
          if (starScore >= i - 0.75) {
            return (
              <StarHalf
                key={i}
                size={13}
                className="star-icon star-half"
                fill="currentColor"
                stroke="currentColor"
              />
            );
          }
          return (
            <Star
              key={i}
              size={13}
              className="star-icon star-empty"
              stroke="currentColor"
              fill="none"
            />
          );
        })}
      </div>
      {showScore && <span className="star-score">{starScore.toFixed(1)}</span>}
    </div>
  );
}

function ActressImage({ actress, alt }: { actress: Actress; alt: string }) {
  // Cached user-generated image dimensions vary; avoid optimizer routes for local snapshots.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="actress-image" src={actress.imagePath} alt={alt} />
  );
}

const Card = memo(function Card({
  actress,
  language,
  small = false,
  slot,
  onClick,
}: {
  actress: Actress;
  language: Language;
  small?: boolean;
  slot?: number;
  onClick?: () => void;
}) {
  const topMovie = actress.contributingMovies?.[0];
  return (
    <div
      className={`actress-card ${small ? 'small' : ''} ${onClick ? 'clickable' : ''}`}
      data-slot-id={slot}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${actress.name} (${actress.nativeName || ''})` : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={
        {
          '--rarity': colors[actress.tier],
          ...(slot === undefined
            ? {}
            : { position: 'absolute', left: slot * reelStep }),
        } as React.CSSProperties
      }
    >
      <span className="tier">{copy[language].tiers[actress.tier]}</span>
      <ActressImage actress={actress} alt={actress.name} />
      <div className="card-copy">
        <strong>{actress.name}</strong>
        {actress.nativeName && <span>{actress.nativeName}</span>}
        <div className="card-quick-meta">
          {actress.cup && (
            <span className="meta-badge cup-badge">
              {actress.cup.replace(/-Cup$/i, '')} Cup
            </span>
          )}
          {actress.heightCm && (
            <span className="meta-badge">{actress.heightCm}cm</span>
          )}
          {topMovie && (
            <span
              className="meta-badge movie-badge"
              title={`Top phim: ${topMovie.code}`}
            >
              {topMovie.code}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default function Home() {
  const { snapshot, status, error } = useActressSnapshot();
  const preferences = usePreferences();
  const { count: localSpins, recordSpin } = useLocalSpinCount();
  const {
    count: serverSpins,
    status: serverSpinStatus,
    increment: recordServerSpin,
  } = useServerSpinCount();
  const [language, setLanguage] = useState<Language>('vi');
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [activeCrate, setActiveCrate] = useState<CrateType>('actress');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [result, setResult] = useState<Actress | null>(null);
  const [movieResult, setMovieResult] = useState<Movie | null>(null);
  const [lastChoice, setLastChoice] = useState<Actress | null>(null);
  const [lastMovieChoice, setLastMovieChoice] = useState<Movie | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<Actress[]>([]);

  type ReelItem = { id: number; actress?: Actress; movie?: Movie };
  const [reel, setReel] = useState<ReelItem[]>([]);
  const [visibleStart, setVisibleStart] = useState(0);

  const { user, signOut: authSignOut } = useAuth();
  const {
    items: inventoryItems,
    stats: inventoryStats,
    addItem: addInventoryItem,
  } = useInventory(user);

  const busy = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const position = useRef(-400);
  const frame = useRef(0);
  const audio = useRef<CaseAudio | null>(null);
  const t = copy[language];

  const movies = useMemo(
    () => (snapshot ? buildMoviesFromSnapshot(snapshot) : []),
    [snapshot],
  );

  useEffect(() => {
    const saved = readCookie<Language>('language');
    const next = saved === 'en' ? 'en' : 'vi';
    setLanguage(next);
    document.documentElement.lang = next;
  }, []);
  const changeLanguage = (next: Language) => {
    setLanguage(next);
    document.documentElement.lang = next;
    try {
      writeCookie('language', next);
    } catch {}
  };
  useEffect(() => {
    document.title = language === 'vi' ? 'Tối Nay Lọ Gì?' : 'Who tonight?';
  }, [language]);
  useEffect(() => {
    const engine = new CaseAudio();
    audio.current = engine;
    engine.preload();
    const handleVisibility = () => {
      if (document.hidden) engine.pause();
      else engine.recover();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      engine.dispose();
      audio.current = null;
    };
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  useEffect(() => {
    if (snapshot && !spinning) setActive(snapshot.actresses);
  }, [snapshot, spinning]);
  const eligible = useMemo(
    () => eligibleActresses(active, preferences.profile),
    [active, preferences.profile],
  );
  useEffect(() => {
    const pool = activeCrate === 'actress' ? eligible : movies;
    if (!pool.length) {
      setReel([]);
      setVisibleStart(0);
      position.current = reelInitialOffset;
      if (track.current)
        track.current.style.transform = `translate3d(${position.current}px,0,0)`;
      return;
    }
    const firstSlot = Math.floor(Math.random() * pool.length);
    setReel(
      Array.from({ length: 12 }, (_, index) => {
        const id = firstSlot + index;
        const item = pool[id % pool.length]!;
        return activeCrate === 'actress'
          ? { id, actress: item as Actress }
          : { id, movie: item as Movie };
      }),
    );
    setVisibleStart(firstSlot);
    position.current = reelInitialOffset - firstSlot * reelStep;
    if (track.current)
      track.current.style.transform = `translate3d(${position.current}px,0,0)`;
  }, [eligible, movies, activeCrate]);

  useEffect(() => {
    const last = readCookie<{ id?: unknown }>('last-choice');
    if (last?.id && typeof last.id === 'string') {
      const found = active.find((item) => item.id === last.id) ?? null;
      setResult(found);
      setLastChoice(found);
    }
  }, [active]);

  const attachTrack = useCallback((node: HTMLDivElement | null) => {
    track.current = node;
    if (node) node.style.transform = `translate3d(${position.current}px,0,0)`;
  }, []);

  function open() {
    const pool = activeCrate === 'actress' ? eligible : movies;
    if (busy.current || !pool.length || !track.current || !viewport.current)
      return;
    audio.current?.unlock();
    busy.current = true;
    const winner =
      activeCrate === 'actress'
        ? chooseTiered(eligible)
        : chooseTiered(movies);
    const step = reelStep,
      tileWidth = 240,
      width = viewport.current.clientWidth;
    const start = position.current;
    const center = Math.floor((width / 2 - start) / step);
    const profile = createSpinProfile(
      Math.random,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const target = center + profile.tiles;
    const end = width / 2 - tileWidth * stopFraction() - target * step;
    const current = reel.filter(
      ({ id }) => id >= Math.max(0, center - 6) && id <= target + 4,
    );
    let last = current.length
      ? Math.max(...current.map((item) => item.id))
      : center;
    const recent: (Actress | Movie)[] = [];
    while (last < target + 4) {
      last++;
      const options = pool.filter((item) => !recent.includes(item));
      const chosen =
        last === target
          ? winner
          : activeCrate === 'actress'
            ? chooseTiered(
                options.length ? (options as Actress[]) : eligible,
              )
            : chooseTiered(
                options.length ? (options as Movie[]) : movies,
              );
      if (activeCrate === 'actress') {
        current.push({ id: last, actress: chosen as Actress });
      } else {
        current.push({ id: last, movie: chosen as Movie });
      }
      recent.push(chosen);
      if (recent.length > 8) recent.shift();
    }
    flushSync(() => {
      setReel(current);
      setSpinning(true);
      setResult(null);
      setMovieResult(null);
    });
    audio.current?.play('csgo_ui_crate_open');
    const began = performance.now();
    let shown = visibleStart;
    let lastCell = Math.floor((start - width / 2) / step);
    const animate = (now: number) => {
      const progress = Math.max(
        0,
        Math.min(1, (now - began) / profile.durationMs),
      );
      const next =
        start + (end - start) * spinProgress(progress, profile.friction);
      position.current = next;
      const first = Math.max(0, Math.floor(-next / step));
      if (first - shown >= 4 || first < shown) {
        shown = Math.max(0, first - 2);
        setVisibleStart(shown);
      }
      if (track.current)
        track.current.style.transform = `translate3d(${next}px,0,0)`;
      const cell = Math.floor((next - width / 2) / step);
      while (cell !== lastCell) {
        lastCell += cell > lastCell ? 1 : -1;
        audio.current?.play('csgo_ui_crate_item_scroll');
      }
      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
        return;
      }
      if (activeCrate === 'actress') {
        const actressWinner = winner as Actress;
        recordSpin(actressWinner);
        void recordServerSpin();
        setResult(actressWinner);
        setLastChoice(actressWinner);
        void addInventoryItem(
          {
            id: actressWinner.id,
            name: actressWinner.name,
            subname: actressWinner.nativeName,
            tier: actressWinner.tier,
            imageUrl: actressWinner.imagePath,
            metadata: {
              cup: actressWinner.cup,
              heightCm: actressWinner.heightCm,
            },
          },
          'actress',
        );
      } else {
        const movieWinner = winner as Movie;
        void recordServerSpin();
        setMovieResult(movieWinner);
        setLastMovieChoice(movieWinner);
        void addInventoryItem(
          {
            id: movieWinner.id,
            name: movieWinner.code,
            subname: movieWinner.title,
            tier: movieWinner.tier,
            imageUrl: movieWinner.coverUrl,
            metadata: {
              actressNames: movieWinner.actressNames,
              movieUrl: movieWinner.movieUrl,
            },
          },
          'movie',
        );
      }
      busy.current = false;
      setSpinning(false);
      setRevealed(true);
      audio.current?.play(
        (
          [
            'item_reveal3_rare',
            'item_reveal4_mythical',
            'item_reveal5_legendary',
            'item_reveal6_ancient',
            'item_reveal6_ancient',
          ] as const
        )[winner.tier],
      );
    };
    frame.current = requestAnimationFrame(animate);
  }

  const allowDirectCardDialog =
    process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG !== 'false';

  const handleCardClick = useCallback(
    (actress: Actress) => {
      if (!allowDirectCardDialog || spinning || busy.current) return;
      setResult(actress);
      setMovieResult(null);
      setRevealed(true);
    },
    [allowDirectCardDialog, spinning],
  );

  const handleMovieCardClick = useCallback(
    (movie: Movie) => {
      if (!allowDirectCardDialog || spinning || busy.current) return;
      setMovieResult(movie);
      setResult(null);
      setRevealed(true);
    },
    [allowDirectCardDialog, spinning],
  );

  const inventory = useMemo(() => {
    if (activeCrate === 'actress') {
      return [...eligible]
        .sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name))
        .map((actress) => (
          <Card
            key={actress.id}
            actress={actress}
            language={language}
            small
            onClick={
              allowDirectCardDialog ? () => handleCardClick(actress) : undefined
            }
          />
        ));
    }
    return [...movies]
      .sort((a, b) => b.tier - a.tier || a.code.localeCompare(b.code))
      .map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          language={language}
          small
          onClick={
            allowDirectCardDialog ? () => handleMovieCardClick(movie) : undefined
          }
        />
      ));
  }, [
    activeCrate,
    eligible,
    movies,
    language,
    allowDirectCardDialog,
    handleCardClick,
    handleMovieCardClick,
  ]);

  if (!snapshot)
    return (
      <main className="cache-state">
        <h1>Tối Nay Lọ Gì?</h1>
        <p>{error ? t.cacheError : t.loading}</p>
        <small>{status.message}</small>
      </main>
    );

  return (
    <div className="site-shell">
      <header>
        <Link href="/" className="brand">
          <CircleHelp className="brand-case" size={24} strokeWidth={2.5} />
          <span>
            TỐI NAY <b>LỌ GÌ?</b>
          </span>
        </Link>
        <div className="header-actions">
          <UserMenu
            user={user}
            inventoryCount={inventoryStats.totalSpins}
            onOpenInventory={() => setInventoryOpen(true)}
            onSignOut={authSignOut}
          />
          <PreferencesPanel
            preferences={preferences}
            actresses={active}
            language={language}
            disabled={spinning}
          />
          <button
            className="language-button"
            onClick={() => changeLanguage(language === 'vi' ? 'en' : 'vi')}
            aria-label={t.language}
          >
            {language === 'vi' ? 'EN' : 'VI'}
          </button>
          <button
            className="sound-button"
            onClick={() => {
              audio.current?.setMuted(sound);
              setSound(!sound);
            }}
            aria-label={sound ? t.turnSoundOff : t.turnSoundOn}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <h1>{t.subtitle}</h1>
          </div>
          <div className="stattrak-container" title={t.serverCounterTitle}>
            <div className="stattrak-badge">
              <span className="stattrak-label">{t.stattrakLabel}</span>
              <span className="stattrak-caption">{t.stattrakSpins}</span>
              <span
                className="stattrak-digits"
                aria-label={
                  serverSpinStatus === 'unavailable'
                    ? t.serverCounterUnavailable
                    : undefined
                }
              >
                {serverSpins === null
                  ? '—'
                  : String(serverSpins).padStart(6, '0')}
              </span>
            </div>
          </div>
        </div>
        {status.state === 'refreshing' && (
          <p className="refresh-status" role="status">
            {t.refreshing}
          </p>
        )}
        {status.state === 'error' && (
          <p className="preferences-message" role="status">
            {status.message || t.cacheError}
          </p>
        )}
        {activeCrate === 'actress' && !eligible.length && (
          <p className="preferences-message">{t.noEligible}</p>
        )}

        <CrateSwitcher
          activeCrate={activeCrate}
          onChange={(crate) => {
            if (spinning || busy.current) return;
            setActiveCrate(crate);
          }}
          actressesCount={eligible.length}
          moviesCount={movies.length}
          disabled={spinning}
        />

        <div className="cs-case-heading">
          <div className="cs-case-emblem" aria-hidden="true">
            {activeCrate === 'actress' ? <Sparkles size={20} /> : <Film size={20} />}
          </div>
          <div className="cs-case-info">
            <span className="cs-case-subtitle">
              {activeCrate === 'actress'
                ? t.crateCollection
                : language === 'vi'
                  ? 'Tuyển Tập Phim Hot'
                  : 'Hot Movie Collection'}
            </span>
            <h2 className="cs-case-title">
              {activeCrate === 'actress'
                ? t.crateTitle
                : language === 'vi'
                  ? 'Hòm Phim Siêu Phẩm'
                  : 'Blockbuster Movie Crate'}
            </h2>
          </div>
          <div className={`cs-case-status ${spinning ? 'opening' : 'ready'}`}>
            <span className="cs-case-status-dot" />
            <span>{spinning ? t.openingCase : t.readyToOpen}</span>
          </div>
        </div>
        <section className="case-panel" aria-label={t.caseLabel}>
          <div className="reel-window" ref={viewport}>
            <div className="selector-line">
              <div className="selector-marker top" />
              <div className="selector-marker bottom" />
            </div>
            <div className="reel-track" ref={attachTrack}>
              {reel
                .filter(
                  ({ id }) => id >= visibleStart && id < visibleStart + 12,
                )
                .map(({ actress, movie, id }) =>
                  actress ? (
                    <Card
                      key={`actress-${id}`}
                      actress={actress}
                      language={language}
                      slot={id}
                      onClick={
                        allowDirectCardDialog
                          ? () => handleCardClick(actress)
                          : undefined
                      }
                    />
                  ) : movie ? (
                    <MovieCard
                      key={`movie-${id}`}
                      movie={movie}
                      language={language}
                      slot={id}
                      onClick={
                        allowDirectCardDialog
                          ? () => handleMovieCardClick(movie)
                          : undefined
                      }
                    />
                  ) : null,
                )}
            </div>
            <div className="reel-fade left" />
            <div className="reel-fade right" />
          </div>
        </section>
        <div className="control-bar">
          <div className="last-choice-slot">
            <span className="last-choice-tag">
              {t.lastChoice} ({localSpins}):
            </span>
            {activeCrate === 'actress' && lastChoice ? (
              <div className="last-choice-card">
                <span
                  className="last-choice-tier-pill"
                  style={
                    {
                      '--rarity': colors[lastChoice.tier],
                    } as React.CSSProperties
                  }
                >
                  {t.tiers[lastChoice.tier]}
                </span>
                <strong className="last-choice-name">
                  {lastChoice.name}
                  {lastChoice.nativeName ? ` (${lastChoice.nativeName})` : ''}
                </strong>
              </div>
            ) : activeCrate === 'movie' && lastMovieChoice ? (
              <div className="last-choice-card">
                <span
                  className="last-choice-tier-pill"
                  style={
                    {
                      '--rarity': colors[lastMovieChoice.tier],
                    } as React.CSSProperties
                  }
                >
                  {t.tiers[lastMovieChoice.tier]}
                </span>
                <strong className="last-choice-name">
                  {lastMovieChoice.code} - {lastMovieChoice.title}
                </strong>
              </div>
            ) : (
              <span className="last-choice-empty">—</span>
            )}
          </div>
          <button
            className="open-button"
            disabled={
              spinning ||
              (activeCrate === 'actress' ? !eligible.length : !movies.length)
            }
            onClick={open}
          >
            {spinning ? <AudioLines size={22} /> : <Sparkles size={21} />}
            {spinning ? t.opening : (result || movieResult) ? t.openAgain : t.open}
          </button>
        </div>
        <Dialog open={revealed} onOpenChange={setRevealed}>
          <DialogContent className="winner-dialog" showCloseButton={false}>
            {result && (
              <>
                <DialogTitle className="winner-title">
                  {result.name}
                </DialogTitle>
                {(result.nativeName || result.nameReading || result.age) && (
                  <p className="winner-native-name">
                    {[
                      result.nativeName,
                      result.nameReading,
                      result.age ? `${result.age} ${t.ageUnit}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <DialogDescription className="winner-description">
                  {t.tiers[result.tier]}
                </DialogDescription>
                <div
                  className="winner-art"
                  style={
                    { '--rarity': colors[result.tier] } as React.CSSProperties
                  }
                >
                  <ActressImage actress={result} alt={result.name} />
                </div>
                {(result.birthDate ||
                  result.heightCm ||
                  result.debutYear ||
                  result.bustCm ||
                  result.waistCm ||
                  result.hipCm ||
                  result.cup ||
                  result.bloodType ||
                  result.videoCount) && (
                  <div className="winner-details">
                    <div className="winner-detail">
                      <span>{t.profile}</span>
                      <strong>
                        {[
                          result.birthDate
                            ? formatBirthDate(result.birthDate, language)
                            : null,
                          result.heightCm ? `${result.heightCm} cm` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </strong>
                      {result.debutYear && (
                        <small className="winner-subdetail">
                          {`${t.debut}: ${result.debutYear}`}
                        </small>
                      )}
                    </div>

                    <div className="winner-detail">
                      <span>{t.measurements}</span>
                      <strong>
                        {result.bustCm ||
                        result.waistCm ||
                        result.hipCm ||
                        result.cup
                          ? `B${result.bustCm ?? '—'}${result.cup ? ` (${result.cup.replace(/-Cup$/i, '').trim()})` : ''} · W${result.waistCm ?? '—'} · H${result.hipCm ?? '—'} cm`
                          : '—'}
                      </strong>
                      {(result.bloodType || result.videoCount) && (
                        <small className="winner-subdetail">
                          {[
                            result.bloodType
                              ? `${t.bloodType}: ${result.bloodType}`
                              : null,
                            result.videoCount
                              ? `${result.videoCount} ${t.videoCountUnit}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </small>
                      )}
                    </div>
                  </div>
                )}

                {result.ratings && (
                  <div className="winner-ratings-card">
                    <div className="winner-ratings-header">
                      <span className="winner-ratings-label">{t.ratings}</span>
                      {result.ratings.overall !== undefined && (
                        <div className="winner-rating-overall">
                          <span className="overall-label">
                            {t.overallScore}
                          </span>
                          <StarRating score={result.ratings.overall} />
                        </div>
                      )}
                    </div>
                    <div className="winner-ratings-grid">
                      {result.ratings.looks !== undefined && (
                        <div className="winner-rating-item">
                          <span className="rating-name">{t.looksScore}</span>
                          <StarRating score={result.ratings.looks} />
                        </div>
                      )}
                      {result.ratings.body !== undefined && (
                        <div className="winner-rating-item">
                          <span className="rating-name">{t.bodyScore}</span>
                          <StarRating score={result.ratings.body} />
                        </div>
                      )}
                      {result.ratings.charm !== undefined && (
                        <div className="winner-rating-item">
                          <span className="rating-name">{t.charmScore}</span>
                          <StarRating score={result.ratings.charm} />
                        </div>
                      )}
                      {result.ratings.eroticAppeal !== undefined && (
                        <div className="winner-rating-item">
                          <span className="rating-name">
                            {t.eroticAppealScore}
                          </span>
                          <StarRating score={result.ratings.eroticAppeal} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.tags && result.tags.length > 0 && (
                  <div className="winner-tags" aria-label={t.tags}>
                    {result.tags.map((tag) => (
                      <span key={tag} className="winner-tag">
                        {language === 'en' && TAG_VI_TO_EN[tag]
                          ? TAG_VI_TO_EN[tag]
                          : tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="winner-movies-section">
                  <div className="winner-movies-heading">
                    <Film size={15} />
                    <strong>{t.topFilms}</strong>
                    <span className="winner-movies-count">
                      ({result.contributingMovies.length} phim)
                    </span>
                  </div>
                  <div className="winner-movies-list">
                    {result.contributingMovies.map((movie) => {
                      const info = parseMovieInfo(movie);
                      return (
                        <div key={movie.code} className="winner-movie-row">
                          <div className="winner-movie-header">
                            <div className="winner-movie-left">
                              <span className="winner-movie-rank">#{info.rank}</span>
                              <span className="winner-movie-code">{info.code}</span>
                            </div>
                            <div className="winner-movie-actions">
                              <a
                                href={info.searchGoogle}
                                target="_blank"
                                rel="noreferrer"
                                className="winner-movie-btn"
                                title="Tìm kiếm trên Google"
                              >
                                Google <ExternalLink size={10} />
                              </a>
                              <a
                                href={info.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="winner-movie-btn source-btn"
                                title="Xem trang nguồn phim"
                              >
                                Chi tiết <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                          {info.title && info.title !== info.code && (
                            <p className="winner-movie-title">{info.title}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {result.socialLinks.length > 0 && (
                  <div className="winner-socials">
                    {result.socialLinks.map((social, index) => (
                      <a
                        key={`${social.label}-${social.url}-${index}`}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {social.label}
                        {social.handle ? ` @${social.handle}` : ''}{' '}
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                )}
                {(result.wikipediaUrl || result.minnanoAvUrl) && (
                  <div className="winner-socials winner-reference-links">
                    {result.wikipediaUrl && (
                      <a
                        href={result.wikipediaUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.wikipedia} <ExternalLink size={12} />
                      </a>
                    )}
                    {result.minnanoAvUrl && (
                      <a
                        href={result.minnanoAvUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.minnanoAvProfile} <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}
                <div className="winner-actions">
                  <a
                    className="find-button"
                    href={`https://www.google.com/search?q=${encodeURIComponent(result.nativeName || result.name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t.source}</span>
                    <ExternalLink size={16} />
                  </a>
                  <button onClick={() => setRevealed(false)}>
                    {t.continue}
                  </button>
                </div>
              </>
            )}

            {movieResult && (
              <>
                <DialogTitle className="winner-title">
                  {movieResult.code}
                </DialogTitle>
                <p className="winner-native-name">
                  {movieResult.title}
                </p>
                <DialogDescription className="winner-description">
                  {t.tiers[movieResult.tier]}
                </DialogDescription>
                <div
                  className="winner-art movie-winner-art"
                  style={
                    { '--rarity': colors[movieResult.tier] } as React.CSSProperties
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="actress-image"
                    src={movieResult.coverUrl}
                    alt={movieResult.code}
                  />
                </div>

                <div className="winner-details">
                  <div className="winner-detail">
                    <span>Mã Phim</span>
                    <strong>{movieResult.code}</strong>
                    <small className="winner-subdetail">
                      Hạng phổ biến: #{movieResult.rank}
                    </small>
                  </div>
                  <div className="winner-detail">
                    <span>Diễn Viên Tham Gia</span>
                    <strong>
                      {movieResult.actressNames.length > 0
                        ? movieResult.actressNames.join(', ')
                        : 'Đang cập nhật'}
                    </strong>
                    <small className="winner-subdetail">
                      Phẩm chất: {t.tiers[movieResult.tier]}
                    </small>
                  </div>
                </div>

                <div className="winner-actions">
                  <a
                    className="find-button"
                    href={`https://www.google.com/search?q=${encodeURIComponent(movieResult.code)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Google Phim</span>
                    <ExternalLink size={16} />
                  </a>
                  <a
                    className="find-button"
                    style={{ background: '#3b82f6', color: '#fff' }}
                    href={movieResult.movieUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Trang Nguồn</span>
                    <ExternalLink size={16} />
                  </a>
                  <button onClick={() => setRevealed(false)}>
                    {t.continue}
                  </button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        <section className="inventory">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.whatsInside}</span>
              <div className="inventory-title-row">
                <h2>
                  {activeCrate === 'actress'
                    ? t.items
                    : language === 'vi'
                      ? 'Phim trong hòm'
                      : 'Movies in crate'}{' '}
                  <span>
                    {activeCrate === 'actress' ? eligible.length : movies.length}
                  </span>
                </h2>
                {activeCrate === 'actress' && (
                  <PreferencesPanel
                    preferences={preferences}
                    actresses={active}
                    language={language}
                    disabled={spinning}
                    variant="inventory"
                  />
                )}
              </div>
            </div>
            <div className="rarity-legend">
              {t.tiers.map((tier, index) => (
                <span key={tier}>
                  <i style={{ background: colors[index] }} />
                  {tier}
                </span>
              ))}
            </div>
          </div>
          <div className="inventory-grid">{inventory}</div>
        </section>

        <InventoryDialog
          open={inventoryOpen}
          onOpenChange={setInventoryOpen}
          items={inventoryItems}
          totalActressesCount={eligible.length}
          totalMoviesCount={movies.length}
        />
        <AuthDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
        />
        <footer>
          <div className="footer-left">
            <span>
              Tối Nay Lọ Gì? ·{' '}
              <a href="/privacy.html">
                {language === 'vi' ? 'Quyền riêng tư' : 'Privacy'}
              </a>{' '}
              ·{' '}
              <a href="/terms.html">
                {language === 'vi' ? 'Điều khoản' : 'Terms'}
              </a>
            </span>
            <span className="footer-source">
              {t.sourceData}{' '}
              {new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                dateStyle: 'medium',
              }).format(new Date(snapshot.createdAt))}
            </span>
          </div>
          <div className="footer-right">
            <span>
              {t.adultNote} {t.footer}{' '}
              <a
                href="https://github.com/sourcesounds/csgo"
                target="_blank"
                rel="noreferrer"
              >
                SourceSounds
              </a>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
