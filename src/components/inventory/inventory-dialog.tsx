'use client';

import { useState, useMemo } from 'react';
import {
  Package,
  Film,
  User as UserIcon,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { InventoryItem, ItemType } from '@/lib/supabase/types';
import { copy } from '@/lib/i18n';

const colors = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#e4ae39'];

export function InventoryDialog({
  open,
  onOpenChange,
  items,
  totalActressesCount = 0,
  totalMoviesCount = 0,
  onSelectItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  totalActressesCount?: number;
  totalMoviesCount?: number;
  onSelectItem?: (item: InventoryItem) => void;
}) {
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [filterTier, setFilterTier] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterType !== 'all' && item.item_type !== filterType) return false;
      if (filterTier !== 'all' && item.tier !== filterTier) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = item.item_name.toLowerCase().includes(query);
        const matchesSub = item.item_subname?.toLowerCase().includes(query);
        return matchesName || matchesSub;
      }
      return true;
    });
  }, [items, filterType, filterTier, search]);

  const stats = useMemo(() => {
    const actresses = items.filter((i) => i.item_type === 'actress');
    const movies = items.filter((i) => i.item_type === 'movie');
    const totalSpins = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    return {
      actressesCount: actresses.length,
      moviesCount: movies.length,
      totalSpins,
    };
  }, [items]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inventory-dialog-content" showCloseButton={true}>
        <div className="inventory-header">
          <div className="inventory-title-wrap">
            <Package size={22} className="inventory-icon" />
            <div>
              <DialogTitle className="inventory-title">Túi Đồ & Bộ Sưu Tập</DialogTitle>
              <DialogDescription className="inventory-subtitle">
                Toàn bộ nữ diễn viên và phim bạn đã mở được từ các hòm thưởng
              </DialogDescription>
            </div>
          </div>

          <div className="inventory-stats-bar">
            <div className="inventory-stat-card">
              <span className="stat-label">Tổng lượt quay</span>
              <strong className="stat-value">{stats.totalSpins}</strong>
            </div>
            <div className="inventory-stat-card">
              <span className="stat-label">Diễn viên sở hữu</span>
              <strong className="stat-value">
                {stats.actressesCount}
                {totalActressesCount > 0 && <small>/{totalActressesCount}</small>}
              </strong>
            </div>
            <div className="inventory-stat-card">
              <span className="stat-label">Phim sở hữu</span>
              <strong className="stat-value">
                {stats.moviesCount}
                {totalMoviesCount > 0 && <small>/{totalMoviesCount}</small>}
              </strong>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="inventory-toolbar">
          <div className="inventory-type-tabs">
            <button
              type="button"
              className={`inv-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              <Sparkles size={14} /> Tất cả ({items.length})
            </button>
            <button
              type="button"
              className={`inv-tab ${filterType === 'actress' ? 'active' : ''}`}
              onClick={() => setFilterType('actress')}
            >
              <UserIcon size={14} /> Diễn viên ({stats.actressesCount})
            </button>
            <button
              type="button"
              className={`inv-tab ${filterType === 'movie' ? 'active' : ''}`}
              onClick={() => setFilterType('movie')}
            >
              <Film size={14} /> Phim ({stats.moviesCount})
            </button>
          </div>

          <div className="inventory-search-wrap">
            <Search size={14} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã phim…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tier filter */}
        <div className="inventory-tier-filters">
          <button
            type="button"
            className={`tier-pill-btn ${filterTier === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTier('all')}
          >
            Tất cả phẩm cấp
          </button>
          {copy.vi.tiers.map((tierName, index) => (
            <button
              key={tierName}
              type="button"
              className={`tier-pill-btn ${filterTier === index ? 'active' : ''}`}
              style={{ '--rarity': colors[index] } as React.CSSProperties}
              onClick={() => setFilterTier(filterTier === index ? 'all' : index)}
            >
              <i style={{ background: colors[index] }} />
              {tierName}
            </button>
          ))}
        </div>

        {/* Grid of items */}
        {filtered.length === 0 ? (
          <div className="inventory-empty-state">
            <Package size={48} />
            <p>Chưa có vật phẩm nào phù hợp trong túi đồ.</p>
            <small>Hãy mở hòm thưởng để tích lũy diễn viên và siêu phẩm phim!</small>
          </div>
        ) : (
          <div className="inventory-items-grid">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="inventory-card"
                style={{ '--rarity': colors[item.tier] } as React.CSSProperties}
                onClick={() => {
                  setSelectedDetail(item);
                  onSelectItem?.(item);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="inv-card-badge-row">
                  <span className="inv-card-tier">{copy.vi.tiers[item.tier]}</span>
                  {item.quantity > 1 && (
                    <span className="inv-card-qty">x{item.quantity}</span>
                  )}
                </div>

                <div className="inv-card-art">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt={item.item_name} loading="lazy" />
                </div>

                <div className="inv-card-info">
                  <span className="inv-card-type-tag">
                    {item.item_type === 'actress' ? 'Diễn viên' : 'Phim'}
                  </span>
                  <strong className="inv-card-name" title={item.item_name}>
                    {item.item_name}
                  </strong>
                  {item.item_subname && (
                    <span className="inv-card-sub" title={item.item_subname}>
                      {item.item_subname}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail view dialog */}
        {selectedDetail && (
          <Dialog open={Boolean(selectedDetail)} onOpenChange={() => setSelectedDetail(null)}>
            <DialogContent className="item-quick-detail">
              <DialogTitle className="detail-title">{selectedDetail.item_name}</DialogTitle>
              {selectedDetail.item_subname && (
                <p className="detail-sub">{selectedDetail.item_subname}</p>
              )}
              <div
                className="detail-art"
                style={{ '--rarity': colors[selectedDetail.tier] } as React.CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedDetail.image_url} alt={selectedDetail.item_name} />
              </div>
              <div className="detail-meta-list">
                <div>
                  <span>Phẩm cấp:</span>
                  <strong style={{ color: colors[selectedDetail.tier] }}>
                    {copy.vi.tiers[selectedDetail.tier]}
                  </strong>
                </div>
                <div>
                  <span>Số lần quay trúng:</span>
                  <strong>{selectedDetail.quantity} lần</strong>
                </div>
                <div>
                  <span>Thu thập lần đầu:</span>
                  <strong>
                    {new Date(selectedDetail.first_obtained_at).toLocaleDateString('vi-VN')}
                  </strong>
                </div>
              </div>

              {selectedDetail.item_type === 'movie' && (
                <div className="detail-actions">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(selectedDetail.item_id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="detail-link-btn"
                  >
                    Tìm Google <ExternalLink size={14} />
                  </a>
                  {typeof selectedDetail.metadata?.movieUrl === 'string' && (
                    <a
                      href={selectedDetail.metadata.movieUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="detail-link-btn source-link"
                    >
                      Xem trang nguồn <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
