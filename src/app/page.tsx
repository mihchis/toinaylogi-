'use client';

import Link from 'next/link';
import { flushSync } from 'react-dom';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Box,
  ExternalLink,
  Sparkles,
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
import { usePreferences } from '@/hooks/use-preferences';
import { eligibleActresses } from '@/lib/actress-preferences';
import { PreferencesPanel } from '@/components/preferences-panel';
import { CaseAudio } from '@/lib/case-audio';

const colors = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#e4ae39'];

function formatBirthDate(value: string, language: Language) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'long',
  }).format(new Date(year, month - 1, day));
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
}: {
  actress: Actress;
  language: Language;
  small?: boolean;
  slot?: number;
}) {
  return (
    <div
      className={`actress-card ${small ? 'small' : ''}`}
      data-slot-id={slot}
      style={
        {
          '--rarity': colors[actress.tier],
          ...(slot === undefined
            ? {}
            : { position: 'absolute', left: slot * 254 }),
        } as React.CSSProperties
      }
    >
      <span className="tier">{copy[language].tiers[actress.tier]}</span>
      <ActressImage actress={actress} alt={actress.publicName} />
      <div className="card-copy">
        <strong>{actress.publicName}</strong>
      </div>
    </div>
  );
});

export default function Home() {
  const { snapshot, status, error } = useActressSnapshot();
  const preferences = usePreferences();
  const { count: localSpins, recordSpin } = useLocalSpinCount();
  const [language, setLanguage] = useState<Language>('vi');
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Actress | null>(null);
  const [lastChoice, setLastChoice] = useState<Actress | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<Actress[]>([]);
  const [reel, setReel] = useState<{ actress: Actress; id: number }[]>([]);
  const [visibleStart, setVisibleStart] = useState(0);
  const busy = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const position = useRef(-400);
  const frame = useRef(0);
  const audio = useRef<CaseAudio | null>(null);
  const t = copy[language];

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
    if (!eligible.length) {
      setReel([]);
      setVisibleStart(0);
      position.current = -400;
      if (track.current)
        track.current.style.transform = `translate3d(${position.current}px,0,0)`;
      return;
    }
    setReel(
      Array.from({ length: 12 }, (_, id) => ({
        id,
        actress: eligible[id % eligible.length],
      })),
    );
    setVisibleStart(0);
    position.current = -400;
    if (track.current)
      track.current.style.transform = `translate3d(${position.current}px,0,0)`;
  }, [eligible]);
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
    if (busy.current || !eligible.length || !track.current || !viewport.current)
      return;
    audio.current?.unlock();
    busy.current = true;
    const winner = chooseTiered(eligible);
    const step = 254,
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
    const recent: Actress[] = [];
    while (last < target + 4) {
      last++;
      const options = eligible.filter((item) => !recent.includes(item));
      const actress =
        last === target
          ? winner
          : chooseTiered(options.length ? options : eligible);
      current.push({ id: last, actress });
      recent.push(actress);
      if (recent.length > 8) recent.shift();
    }
    flushSync(() => {
      setReel(current);
      setSpinning(true);
      setResult(null);
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
      recordSpin(winner);
      busy.current = false;
      setSpinning(false);
      setResult(winner);
      setLastChoice(winner);
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

  const inventory = useMemo(
    () =>
      [...eligible]
        .sort(
          (a, b) => b.tier - a.tier || a.publicName.localeCompare(b.publicName),
        )
        .map((actress) => (
          <Card key={actress.id} actress={actress} language={language} small />
        )),
    [eligible, language],
  );
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
          <span className="brand-case">▣</span>
          <span>
            TỐI NAY <b>LỌ GÌ?</b>
          </span>
        </Link>
        <div className="header-actions">
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
          <a
            className="github-button"
            href="https://github.com/truanayangi-com/truanayangi"
            target="_blank"
            rel="noreferrer"
            aria-label={t.github}
          >
            GitHub <ExternalLink size={14} />
          </a>
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
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
        {!eligible.length && (
          <p className="preferences-message">{t.noEligible}</p>
        )}
        <div className="stattrak-container" title={t.localCounterTitle}>
          <div className="stattrak-badge">
            <span className="stattrak-label">{t.stattrakLabel}</span>
            <span className="stattrak-caption">{t.stattrakSpins}</span>
            <span className="stattrak-digits">
              {String(localSpins).padStart(6, '0')}
            </span>
          </div>
        </div>
        <div className="cs-case-heading">
          <div className="cs-case-emblem" aria-hidden="true">
            <Box size={24} />
          </div>
          <div className="cs-case-info">
            <span className="cs-case-subtitle">{t.crateCollection}</span>
            <h2 className="cs-case-title">{t.crateTitle}</h2>
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
                .map(({ actress, id }) => (
                  <Card
                    key={id}
                    actress={actress}
                    language={language}
                    slot={id}
                  />
                ))}
            </div>
            <div className="reel-fade left" />
            <div className="reel-fade right" />
          </div>
        </section>
        <div className="control-bar">
          <div className="last-choice-slot">
            <span className="last-choice-tag">{t.lastChoice}</span>
            {lastChoice ? (
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
                  {lastChoice.publicName}
                </strong>
              </div>
            ) : (
              <span className="last-choice-empty">—</span>
            )}
          </div>
          <button
            className="open-button"
            disabled={spinning || !eligible.length}
            onClick={open}
          >
            {spinning ? <AudioLines size={22} /> : <Sparkles size={21} />}
            {spinning ? t.opening : result ? t.openAgain : t.open}
          </button>
        </div>
        <Dialog open={revealed} onOpenChange={setRevealed}>
          <DialogContent className="winner-dialog" showCloseButton={false}>
            {result && (
              <>
                <span className="winner-label">{t.newItem}</span>
                <DialogTitle className="winner-title">
                  {result.name}
                </DialogTitle>
                {(result.nativeName || result.nameReading) && (
                  <p className="winner-native-name">
                    {[result.nativeName, result.nameReading]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <DialogDescription className="winner-description">
                  {t.tiers[result.tier]} · {t.score}: {result.score} ·{' '}
                  {result.appearances} {t.appearances}
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
                  result.age ||
                  result.heightCm ||
                  result.bustCm ||
                  result.waistCm ||
                  result.hipCm ||
                  result.cup ||
                  result.bloodType ||
                  result.hometown ||
                  result.hobby) && (
                  <div className="winner-details">
                    {result.birthDate && (
                      <div className="winner-detail">
                        <span>{t.birthDate}</span>
                        <strong>
                          {formatBirthDate(result.birthDate, language)}
                        </strong>
                      </div>
                    )}
                    {!result.birthDate && result.age && (
                      <div className="winner-detail">
                        <span>{t.age}</span>
                        <strong>{result.age}</strong>
                      </div>
                    )}
                    {result.heightCm && (
                      <div className="winner-detail">
                        <span>{t.height}</span>
                        <strong>{result.heightCm} cm</strong>
                      </div>
                    )}
                    {(result.bustCm || result.waistCm || result.hipCm) && (
                      <div className="winner-detail">
                        <span>{t.measurements}</span>
                        <strong>
                          B{result.bustCm ?? '—'} · W{result.waistCm ?? '—'} · H
                          {result.hipCm ?? '—'} cm
                        </strong>
                      </div>
                    )}
                    {result.cup && (
                      <div className="winner-detail">
                        <span>{t.cup}</span>
                        <strong>{result.cup.replace(/-Cup$/i, '')}</strong>
                      </div>
                    )}
                    {result.bloodType && (
                      <div className="winner-detail">
                        <span>{t.bloodType}</span>
                        <strong>{result.bloodType}</strong>
                      </div>
                    )}
                    {result.hometown && (
                      <div className="winner-detail">
                        <span>{t.hometown}</span>
                        <strong>{result.hometown}</strong>
                      </div>
                    )}
                    {result.hobby && (
                      <div className="winner-detail winner-detail-wide">
                        <span>{t.hobby}</span>
                        <strong>{result.hobby}</strong>
                      </div>
                    )}
                  </div>
                )}
                <div className="winner-profile">
                  <strong>{t.topFilms}</strong>
                  {result.contributingMovies.map((movie) => (
                    <a
                      key={movie.movieUrl}
                      href={movie.movieUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      #{movie.rank} · {movie.code} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
                {result.socialLinks.length > 0 && (
                  <div className="winner-socials">
                    {result.socialLinks.map((social) => (
                      <a
                        key={social.url}
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
                {(result.avBaseUrl || result.wikipediaUrl) && (
                  <div className="winner-socials winner-reference-links">
                    {result.avBaseUrl && (
                      <a
                        href={result.avBaseUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.avBaseProfile} <ExternalLink size={12} />
                      </a>
                    )}
                    {result.wikipediaUrl && (
                      <a
                        href={result.wikipediaUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.wikipedia} <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}
                <div className="winner-actions">
                  <a
                    className="find-button"
                    href={result.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.source} <ExternalLink size={16} />
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
                  {t.items} <span>{eligible.length}</span>
                </h2>
                <PreferencesPanel
                  preferences={preferences}
                  actresses={active}
                  language={language}
                  disabled={spinning}
                  variant="inventory"
                />
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
        </footer>
      </main>
    </div>
  );
}
