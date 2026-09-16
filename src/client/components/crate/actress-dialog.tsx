'use client';

import { memo } from 'react';
import {
  ExternalLink,
  Film,
  Star,
  Sparkles,
  Calendar,
  Ruler,
  Heart,
  Video,
  Flame,
  Award,
  Share2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/client/components/ui/dialog';
import type { Actress, ContributingMovie } from '@/client/lib/actresses';
import { copy, type Language } from '@/client/lib/i18n';
import { TAG_VI_TO_EN } from '@/client/lib/tag-translations';
import { detectStudio } from '@/client/lib/studio-detector';

const colors = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#e4ae39'];

function parseMovieInfo(movie: ContributingMovie) {
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
    studio: detectStudio(movie.code),
    searchGoogle: `https://www.google.com/search?q=${encodeURIComponent(movie.code)}`,
    sourceUrl: movie.movieUrl,
  };
}

function formatBirthDate(value: string, language: Language) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'long',
  }).format(new Date(year, month - 1, day));
}

function ScoreProgressBar({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon?: typeof Star;
}) {
  const percentage = Math.min(100, Math.max(0, (score / 10) * 100));
  const isHigh = score >= 8.0;
  const isMedium = score >= 6.0;
  const barColor = isHigh ? '#e4ae39' : isMedium ? '#d32ce6' : '#4b69ff';

  return (
    <div className="score-bar-row">
      <div className="score-bar-header">
        <span className="score-bar-label">
          {Icon && <Icon size={12} />}
          {label}
        </span>
        <strong className="score-bar-value" style={{ color: barColor }}>
          {score.toFixed(1)} <small>/10</small>
        </strong>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${percentage}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

export const ActressDialog = memo(function ActressDialog({
  actress,
  open,
  onOpenChange,
  language = 'vi',
  onOpenAgain,
}: {
  actress: Actress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: Language;
  onOpenAgain?: () => void;
}) {
  if (!actress) return null;

  const t = copy[language];
  const rarityColor = colors[actress.tier];
  const rarityName = t.tiers[actress.tier];
  const movies = (actress.contributingMovies || []).map(parseMovieInfo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="actress-dialog-wide" showCloseButton={true}>
        {/* Ambient Cinema Backdrop Glow */}
        <div
          className="modal-ambient-glow"
          style={
            {
              '--ambient-color': rarityColor,
              backgroundImage: `url(${actress.imagePath})`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        />

        <div className="actress-dialog-layout">
          {/* CỘT TRÁI: VISUAL HERO & IDENTITY */}
          <div className="actress-dialog-left">
            <div className="actress-portrait-container">
              {/* Rarity Ribbon */}
              <div
                className="actress-rarity-ribbon"
                style={{ background: rarityColor }}
              >
                <Award size={12} />
                <span>{rarityName}</span>
              </div>

              {/* Ambient Glow behind image */}
              <div
                className="portrait-glow-backdrop"
                style={{ backgroundImage: `url(${actress.imagePath})` }}
                aria-hidden="true"
              />

              {/* Main Portrait */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="actress-portrait-img"
                src={actress.imagePath}
                alt={actress.name}
              />
            </div>

            {/* Identity Info */}
            <div className="actress-identity-block">
              <DialogTitle className="actress-main-name">
                {actress.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Hồ sơ chi tiết diễn viên {actress.name}
              </DialogDescription>

              {(actress.nativeName || actress.nameReading || actress.age) && (
                <p className="actress-sub-name">
                  {[
                    actress.nativeName,
                    actress.nameReading,
                    actress.age ? `${actress.age} ${t.ageUnit}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>

            {/* Social & Reference Links */}
            <div className="actress-social-buttons">
              {actress.socialLinks.map((social, index) => (
                <a
                  key={`${social.label}-${social.url}-${index}`}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`social-badge-btn ${social.label.toLowerCase()}`}
                  title={`${social.label}${social.handle ? `: @${social.handle}` : ''}`}
                >
                  <Share2 size={12} />
                  <span>{social.label}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
              {actress.wikipediaUrl && (
                <a
                  href={actress.wikipediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="social-badge-btn wiki"
                >
                  <span>{t.wikipedia}</span>
                  <ExternalLink size={10} />
                </a>
              )}
              {actress.minnanoAvUrl && (
                <a
                  href={actress.minnanoAvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="social-badge-btn minnano"
                >
                  <span>{t.minnanoAvProfile}</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Quick Actions */}
            <div className="actress-quick-actions">
              <a
                className="action-btn-search"
                href={`https://www.google.com/search?q=${encodeURIComponent(actress.nativeName || actress.name)}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>Tìm kiếm Google</span>
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

          {/* CỘT PHẢI: CHỈ SỐ, ĐÁNH GIÁ & BỘ PHIM TIÊU BIỂU */}
          <div className="actress-dialog-right">
            {/* 1. Grid Chỉ Số Sinh Trắc Học */}
            <div className="biometrics-grid">
              <div className="biometric-card">
                <div className="bio-icon">
                  <Ruler size={16} />
                </div>
                <div className="bio-content">
                  <span className="bio-label">Chiều cao & Cúp</span>
                  <strong className="bio-value">
                    {actress.heightCm ? `${actress.heightCm} cm` : '—'}
                    {actress.cup && (
                      <span className="bio-cup-pill">
                        {actress.cup.replace(/-Cup$/i, '').trim()} Cup
                      </span>
                    )}
                  </strong>
                </div>
              </div>

              <div className="biometric-card">
                <div className="bio-icon">
                  <Heart size={16} />
                </div>
                <div className="bio-content">
                  <span className="bio-label">Số đo 3 vòng</span>
                  <strong className="bio-value">
                    {actress.bustCm || actress.waistCm || actress.hipCm
                      ? `B${actress.bustCm || '—'} · W${actress.waistCm || '—'} · H${actress.hipCm || '—'}`
                      : '—'}
                  </strong>
                </div>
              </div>

              <div className="biometric-card">
                <div className="bio-icon">
                  <Calendar size={16} />
                </div>
                <div className="bio-content">
                  <span className="bio-label">Ngày sinh & Ra mắt</span>
                  <strong className="bio-value">
                    {actress.birthDate
                      ? formatBirthDate(actress.birthDate, language)
                      : actress.debutYear
                        ? `Năm ${actress.debutYear}`
                        : '—'}
                  </strong>
                </div>
              </div>

              <div className="biometric-card">
                <div className="bio-icon">
                  <Video size={16} />
                </div>
                <div className="bio-content">
                  <span className="bio-label">Video & Nhóm máu</span>
                  <strong className="bio-value">
                    {actress.videoCount
                      ? `${actress.videoCount} phim`
                      : `${movies.length} phim`}
                    {actress.bloodType && (
                      <span className="bio-blood-pill">
                        Nhóm {actress.bloodType}
                      </span>
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Bảng Đánh Giá Minnano-AV */}
            {actress.ratings && (
              <div className="community-ratings-panel">
                <div className="ratings-panel-header">
                  <div className="ratings-title">
                    <Star size={15} className="star-icon-gold" />
                    <span>Đánh Giá Từ Cộng Đồng (Minnano-AV)</span>
                  </div>
                  {actress.ratings.overall !== undefined && (
                    <div className="overall-score-badge">
                      <span>Tổng quan:</span>
                      <strong>{actress.ratings.overall.toFixed(1)}</strong>
                      <small>/10</small>
                    </div>
                  )}
                </div>

                <div className="ratings-progress-grid">
                  {actress.ratings.looks !== undefined && (
                    <ScoreProgressBar
                      label={t.looksScore}
                      score={actress.ratings.looks}
                      icon={Star}
                    />
                  )}
                  {actress.ratings.body !== undefined && (
                    <ScoreProgressBar
                      label={t.bodyScore}
                      score={actress.ratings.body}
                      icon={Flame}
                    />
                  )}
                  {actress.ratings.charm !== undefined && (
                    <ScoreProgressBar
                      label={t.charmScore}
                      score={actress.ratings.charm}
                      icon={Heart}
                    />
                  )}
                  {actress.ratings.eroticAppeal !== undefined && (
                    <ScoreProgressBar
                      label={t.eroticAppealScore}
                      score={actress.ratings.eroticAppeal}
                      icon={Flame}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 3. Thẻ Phong Cách & Tags */}
            {actress.tags && actress.tags.length > 0 && (
              <div className="actress-tags-container">
                <span className="tags-section-label">Phong cách & Thể loại:</span>
                <div className="tags-chip-list">
                  {actress.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {language === 'en' && TAG_VI_TO_EN[tag]
                        ? TAG_VI_TO_EN[tag]
                        : tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Danh Sách Phim Tiêu Biểu */}
            <div className="filmography-section">
              <div className="filmography-header">
                <div className="filmography-title">
                  <Film size={16} />
                  <span>Bộ Phim Nổi Bật ({movies.length} tác phẩm)</span>
                </div>
                <small className="filmography-hint">
                  Xếp theo độ phổ biến & lượt xem cao nhất
                </small>
              </div>

              <div className="filmography-list-scroll">
                {movies.map((movie) => (
                  <div key={movie.code} className="film-card-row">
                    <div className="film-card-badge-col">
                      <span className="film-rank-badge">#{movie.rank}</span>
                      <strong className="film-code-badge">{movie.code}</strong>
                    </div>

                    <div className="film-card-info-col">
                      <p className="film-title-text" title={movie.title}>
                        {movie.title}
                      </p>
                      {movie.studio && (
                        <span className="film-studio-tag">{movie.studio}</span>
                      )}
                    </div>

                    <div className="film-card-actions-col">
                      <a
                        href={movie.searchGoogle}
                        target="_blank"
                        rel="noreferrer"
                        className="film-action-btn search"
                        title="Tìm kiếm phim trên Google"
                      >
                        Google <ExternalLink size={10} />
                      </a>
                      <a
                        href={movie.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="film-action-btn detail"
                        title="Xem trang nguồn phim"
                      >
                        Nguồn <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
