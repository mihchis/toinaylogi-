'use client';

import { Sparkles, Film } from 'lucide-react';

export type CrateType = 'actress' | 'movie';

export function CrateSwitcher({
  activeCrate,
  onChange,
  actressesCount,
  moviesCount,
  disabled = false,
}: {
  activeCrate: CrateType;
  onChange: (crate: CrateType) => void;
  actressesCount: number;
  moviesCount: number;
  disabled?: boolean;
}) {
  return (
    <div className="crate-switcher-container">
      <button
        type="button"
        className={`crate-switch-btn ${activeCrate === 'actress' ? 'active' : ''}`}
        onClick={() => onChange('actress')}
        disabled={disabled}
      >
        <Sparkles size={16} />
        <span>Hòm Nữ Diễn Viên</span>
        <span className="crate-count-pill">{actressesCount}</span>
      </button>

      <button
        type="button"
        className={`crate-switch-btn ${activeCrate === 'movie' ? 'active' : ''}`}
        onClick={() => onChange('movie')}
        disabled={disabled}
      >
        <Film size={16} />
        <span>Hòm Phim Siêu Phẩm</span>
        <span className="crate-count-pill">{moviesCount}</span>
      </button>
    </div>
  );
}
