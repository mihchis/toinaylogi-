'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export type PageSizeOption = 24 | 48 | 96 | 'all';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: PageSizeOption;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
  language: 'vi' | 'en';
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  language,
  itemName,
  className = '',
}) => {
  if (totalItems <= 0) return null;

  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? totalItems : (pageSize as number);

  const startIdx = isAll ? 1 : Math.min((currentPage - 1) * effectivePageSize + 1, totalItems);
  const endIdx = isAll ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  // Sinh danh sách các nút số trang hiển thị
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];

    // Luôn có trang 1
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Các trang xung quanh currentPage
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Luôn có trang cuối
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const labels = {
    showing: language === 'vi' ? 'Hiển thị' : 'Showing',
    to: language === 'vi' ? '–' : 'to',
    of: language === 'vi' ? 'trên tổng' : 'of',
    items: itemName || (language === 'vi' ? 'mục' : 'items'),
    perPage: language === 'vi' ? 'Mỗi trang:' : 'Per page:',
    all: language === 'vi' ? 'Tất cả' : 'All',
    prev: language === 'vi' ? 'Trang trước' : 'Previous page',
    next: language === 'vi' ? 'Trang sau' : 'Next page',
    first: language === 'vi' ? 'Trang đầu' : 'First page',
    last: language === 'vi' ? 'Trang cuối' : 'Last page',
  };

  return (
    <div className={`pagination-container ${className}`}>
      {/* Thông tin số lượng */}
      <div className="pagination-info">
        <span>
          {labels.showing} <strong>{startIdx}</strong> {labels.to}{' '}
          <strong>{endIdx}</strong> {labels.of} <strong>{totalItems}</strong>{' '}
          {labels.items}
        </span>
      </div>

      {/* Điều khiển chuyển trang */}
      {!isAll && totalPages > 1 && (
        <div className="pagination-controls" role="navigation" aria-label="Pagination">
          <button
            className="pagination-btn pagination-nav-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            title={labels.first}
            aria-label={labels.first}
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            className="pagination-btn pagination-nav-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            title={labels.prev}
            aria-label={labels.prev}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    …
                  </span>
                );
              }

              const isActive = page === currentPage;
              return (
                <button
                  key={`page-${page}`}
                  className={`pagination-btn pagination-page-btn ${
                    isActive ? 'active' : ''
                  }`}
                  onClick={() => onPageChange(page)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            className="pagination-btn pagination-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title={labels.next}
            aria-label={labels.next}
          >
            <ChevronRight size={16} />
          </button>

          <button
            className="pagination-btn pagination-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title={labels.last}
            aria-label={labels.last}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}

      {/* Bộ chọn số lượng hiển thị mỗi trang */}
      <div className="pagination-size-selector">
        <span className="pagination-size-label">{labels.perPage}</span>
        <div className="pagination-size-pills">
          {([24, 48, 96, 'all'] as PageSizeOption[]).map((size) => {
            const isActive = pageSize === size;
            return (
              <button
                key={String(size)}
                className={`pagination-size-pill ${isActive ? 'active' : ''}`}
                onClick={() => onPageSizeChange(size)}
                type="button"
              >
                {size === 'all' ? labels.all : size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
