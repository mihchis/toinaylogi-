'use client';

import { memo } from 'react';
import type { Movie } from '@/lib/movies';
import { copy, type Language } from '@/lib/i18n';

const colors = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#e4ae39'];
const reelStep = 254;

export const MovieCard = memo(function MovieCard({
  movie,
  language = 'vi',
  small = false,
  slot,
  onClick,
}: {
  movie: Movie;
  language?: Language;
  small?: boolean;
  slot?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className={`actress-card movie-card ${small ? 'small' : ''} ${onClick ? 'clickable' : ''}`}
      data-slot-id={slot}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${movie.code} - ${movie.title}` : undefined}
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
          '--rarity': colors[movie.tier],
          ...(slot === undefined
            ? {}
            : { position: 'absolute', left: slot * reelStep }),
        } as React.CSSProperties
      }
    >
      <span className="tier">{copy[language].tiers[movie.tier]}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="actress-image" src={movie.coverUrl} alt={movie.code} />
      <div className="card-copy">
        <strong className="movie-card-code">{movie.code}</strong>
        <span className="movie-card-title" title={movie.title}>
          {movie.title}
        </span>
        {movie.actressNames.length > 0 && (
          <span className="movie-card-actresses">
            {movie.actressNames.join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
});
