'use client';

import { memo, useState } from 'react';
import {
  ExternalLink,
  Film,
  Award,
  Sparkles,
  Building2,
  Users,
  Calendar,
  UserCheck,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  if (!movie) return null;

  const t = copy[language];
  const rarityColor = colors[movie.tier];
  const rarityName = t.tiers[movie.tier];
  const detectedStudio = detectStudio(movie.code);
  const studioName = movie.studio || detectedStudio || 'JAV Studio';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(movie.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="actress-dialog-wide movie-modal-wide" showCloseButton={true}>
        {/* Ambient Glow Backdrop */}
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
          {/* CỘT TRÁI: POSTER PHIM & HÀNH ĐỘNG NHANH */}
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
                loading="eager"
              />
            </div>

            <div className="actress-identity-block">
              <div className="movie-code-row">
                <DialogTitle className="actress-main-name movie-code-title">
                  {movie.code}
                </DialogTitle>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="copy-code-btn"
                  title={language === 'vi' ? 'Sao chép mã phim' : 'Copy movie code'}
                >
                  {copied ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                </button>
              </div>

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
                <span>{language === 'vi' ? 'Google Phim' : 'Google Search'}</span>
                <ExternalLink size={14} />
              </a>
              <a
                className="action-btn-search source"
                href={movie.movieUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>{language === 'vi' ? 'Trang Nguồn' : 'Source Page'}</span>
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
                  <span>{language === 'vi' ? 'Mở tiếp' : 'Open Again'}</span>
                </button>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN PHIM CHI TIẾT & TOÀN DIỆN */}
          <div className="actress-dialog-right">
            {/* LƯỚI THÔNG SỐ PHIM (SPECS GRID) */}
            <div className="biometrics-grid">
              <div className="biometric-card">
                <div className="bio-icon">
                  <Film size={16} />
                </div>
                <div className="bio-content">
                  <span className="bio-label">
                    {language === 'vi' ? 'Mã Phim & Xếp Hạng' : 'Code & Ranking'}
                  </span>
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
                  <span className="bio-label">
                    {language === 'vi' ? 'Hãng Sản Xuất (Studio)' : 'Studio Maker'}
                  </span>
                  <strong className="bio-value">{studioName}</strong>
                </div>
              </div>

              {movie.releaseDate && (
                <div className="biometric-card">
                  <div className="bio-icon">
                    <Calendar size={16} />
                  </div>
                  <div className="bio-content">
                    <span className="bio-label">
                      {language === 'vi' ? 'Ngày Phát Hành' : 'Release Date'}
                    </span>
                    <strong className="bio-value">{movie.releaseDate}</strong>
                  </div>
                </div>
              )}

              {movie.director && (
                <div className="biometric-card">
                  <div className="bio-icon">
                    <UserCheck size={16} />
                  </div>
                  <div className="bio-content">
                    <span className="bio-label">
                      {language === 'vi' ? 'Đạo Diễn' : 'Director'}
                    </span>
                    <strong className="bio-value">{movie.director}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* DÀN NỮ DIỄN VIÊN THAM GIA */}
            <div className="movie-cast-panel">
              <div className="cast-panel-header">
                <Users size={15} />
                <span>
                  {language === 'vi'
                    ? `Nữ Diễn Viên Tham Gia (${movie.actressNames.length} idol)`
                    : `Starring Actresses (${movie.actressNames.length})`}
                </span>
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
                  <span className="cast-empty-hint">
                    {language === 'vi' ? 'Đang cập nhật diễn viên' : 'Updating cast'}
                  </span>
                )}
              </div>
            </div>

            {/* DÀN DIỄN VIÊN NAM (NẾU CÓ) */}
            {movie.actors && movie.actors.length > 0 && (
              <div className="movie-cast-panel actors-panel">
                <div className="cast-panel-header">
                  <Users size={15} />
                  <span>
                    {language === 'vi'
                      ? `Diễn Viên Nam (${movie.actors.length})`
                      : `Male Actors (${movie.actors.length})`}
                  </span>
                </div>
                <div className="cast-names-list">
                  {movie.actors.map((name) => (
                    <span key={name} className="cast-actor-pill">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* THỂ LOẠI & TAGS PHIM */}
            {movie.tags && movie.tags.length > 0 && (
              <div className="movie-tags-panel">
                <div className="tags-panel-header">
                  <Tag size={15} />
                  <span>{language === 'vi' ? 'Thể Loại & Đặc Điểm' : 'Categories & Tags'}</span>
                </div>
                <div className="movie-tags-list">
                  {movie.tags.map((tag) => (
                    <span key={tag} className="movie-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CHI TIẾT TIÊU ĐỀ PHIM */}
            <div className="movie-full-title-panel">
              <span className="full-title-label">
                {language === 'vi' ? 'Tiêu Đề Đầy Đủ:' : 'Full Title:'}
              </span>
              <p className="full-title-content">{movie.title}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
