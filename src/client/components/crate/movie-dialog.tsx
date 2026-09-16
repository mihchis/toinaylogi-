'use client';

import { memo } from 'react';
import { ExternalLink, Film, Award, Sparkles, Building2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/client/components/ui/dialog';
import type { Movie } from '@/client/lib/movies';
import { copy, type Language } from '@/client/lib/i18n';
import { detectStudio } from '@/client/lib/studio-detector';

const colors = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#e4ae39'];

export const MovieDialog = memo(function MovieDialog({
  movie,
  open,
  onOpenChange,
  language = 'vi',
  onOpenAgain,
}: {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: Language;
  onOpenAgain?: () => void;
}) {
  if (!movie) return null;

  const t = copy[language];
  const rarityColor = colors[movie.tier];
  const rarityName = t.tiers[movie.tier];
  const studio = detectStudio(movie.code);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="actress-dialog-wide movie-modal-wide" showCloseButton={true}>
        {/* Ambient Glow */}
        <div
          className="modal-ambient-glow"
          style={
            {
              '--ambient-color': rarityColor,
              backgroundImage: `url(${movie.coverUrl})`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        />

        <div className="actress-dialog-layout">
          {/* CỘT TRÁI: POSTER PHIM & ACTIONS */}
          <div className="actress-dialog-left">
            <div className="actress-portrait-container movie-poster-container">
              <div
                className="actress-rarity-ribbon"
                style={{ background: rarityColor }}
              >
                <Award size={12} />
                <span>{rarityName}</span>
              </div>

              <div
                className="portrait-glow-backdrop"
                style={{ backgroundImage: `url(${movie.coverUrl})` }}
                aria-hidden="true"
              />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="actress-portrait-img movie-poster-img"
                src={movie.coverUrl}
                alt={movie.code}
              />
            </div>

            <div className="actress-identity-block">
              <DialogTitle className="actress-main-name movie-code-title">
                {movie.code}
              </DialogTitle>
              <DialogDescription className="movie-tagline-desc">
                {movie.title}
              </DialogDescription>
            </div>

            <div className="actress-quick-actions">
              <a
                className="action-btn-search"
                href={`https://www.google.com/search?q=${encodeURIComponent(movie.code)}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>Tìm kiếm Google</span>
                <ExternalLink size={14} />
              </a>
              <a
                className="action-btn-search source"
                href={movie.movieUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>Trang Nguồn</span>
                <ExternalLink size={14} />
              </a>
              {onOpenAgain && (
                <button
                  type="button"
                  className="action-btn-again"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenAgain();
                  }}
                >
                  <Sparkles size={14} />
                  <span>Mở tiếp</span>
                </button>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN PHIM CHI TIẾT */}
          <div className="actress-dialog-right">
            <div className="biometrics-grid">
              <div className="biometric-card">
                <div className="bio-icon">
                  <Film size={16} />
                </div>
                <div className="bio-content">
                  <span className="bio-label">Mã Phim & Thứ Hạng</span>
                  <strong className="bio-value">
                    {movie.code}
                    <span className="bio-cup-pill">Hạng #{movie.rank}</span>
                  </strong>
                </div>
              </div>

              <div className="biometric-card">
                <div className="bio-icon">
                  <Building2 size={16} />
                </div>
                <div className="bio-content">
                  <span className="bio-label">Hãng Sản Xuất (Maker)</span>
                  <strong className="bio-value">
                    {studio || 'JAV Studio'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Diễn Viên Tham Gia */}
            <div className="movie-cast-panel">
              <div className="cast-panel-header">
                <Users size={15} />
                <span>Nữ Diễn Viên Tham Gia ({movie.actressNames.length} idol)</span>
              </div>
              <div className="cast-names-list">
                {movie.actressNames.length > 0 ? (
                  movie.actressNames.map((name) => (
                    <a
                      key={name}
                      href={`https://www.google.com/search?q=${encodeURIComponent(name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="cast-idol-pill"
                    >
                      <span>{name}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))
                ) : (
                  <span className="cast-empty-hint">Đang cập nhật diễn viên</span>
                )}
              </div>
            </div>

            {/* Chi Tiết Tiêu Đề */}
            <div className="movie-full-title-panel">
              <span className="full-title-label">Tiêu Đề Đầy Đủ:</span>
              <p className="full-title-content">{movie.title}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
