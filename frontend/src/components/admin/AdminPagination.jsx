import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Helper to compute visible page numbers with ellipsis windowing
 */
function getVisiblePages(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // Always show page 1
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('ellipsis-start');
    }
  }

  // Windowed numbers
  for (let i = start; i <= end; i++) {
    if (i !== 1 && i !== totalPages) {
      pages.push(i);
    }
  }

  // Always show last page
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('ellipsis-end');
    }
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Responsive Admin Table Pagination Component
 *
 * @param {object} props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalPages - Total pages available
 * @param {function} props.onPageChange - Callback when user selects a new page
 * @param {number} [props.totalItems] - Total record count
 * @param {number} [props.itemsPerPage] - Limit per page
 * @param {string} [props.unitLabel='records'] - Noun describing items (e.g. 'products', 'orders', 'users')
 * @param {string} [props.className] - Container CSS overrides
 */
export const AdminPagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  itemsPerPage,
  unitLabel = 'records',
  className = '',
}) => {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const safeCurrent = Math.max(1, Math.min(currentPage, totalPages));
  const hasPrevious = safeCurrent > 1;
  const hasNext = safeCurrent < totalPages;

  const desktopPages = getVisiblePages(safeCurrent, totalPages, 5);
  const mobilePages = getVisiblePages(safeCurrent, totalPages, 3);

  const handleSelect = (page) => {
    if (typeof page !== 'number') return;
    if (page < 1 || page > totalPages || page === safeCurrent) return;
    onPageChange(page);
  };

  const startItem = itemsPerPage ? (safeCurrent - 1) * itemsPerPage + 1 : null;
  const endItem = itemsPerPage && totalItems ? Math.min(safeCurrent * itemsPerPage, totalItems) : null;

  return (
    <div
      className={`p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 ${className}`}
    >
      {/* Summary label */}
      <div className="order-2 sm:order-1 text-center sm:text-left">
        {startItem && endItem && totalItems !== undefined ? (
          <span>
            Showing <strong className="text-white">{startItem}</strong>–<strong className="text-white">{endItem}</strong> of{' '}
            <strong className="text-white">{totalItems}</strong> {unitLabel} (Page{' '}
            <strong className="text-white">{safeCurrent}</strong> of <strong className="text-white">{totalPages}</strong>)
          </span>
        ) : totalItems !== undefined ? (
          <span>
            Showing page <strong className="text-white">{safeCurrent}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong> ({totalItems} {unitLabel})
          </span>
        ) : (
          <span>
            Page <strong className="text-white">{safeCurrent}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Previous */}
        <button
          type="button"
          onClick={() => handleSelect(safeCurrent - 1)}
          disabled={!hasPrevious}
          aria-label="Previous Page"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 font-semibold"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Desktop Number Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {desktopPages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`admin-ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-600 select-none"
                >
                  •••
                </span>
              );
            }

            const isActive = p === safeCurrent;
            return (
              <button
                type="button"
                key={p}
                onClick={() => handleSelect(p)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Mobile Number Buttons */}
        <div className="flex sm:hidden items-center gap-1">
          {mobilePages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`admin-mobile-ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 select-none"
                >
                  •••
                </span>
              );
            }

            const isActive = p === safeCurrent;
            return (
              <button
                type="button"
                key={`mobile-${p}`}
                onClick={() => handleSelect(p)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-7 h-7 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => handleSelect(safeCurrent + 1)}
          disabled={!hasNext}
          aria-label="Next Page"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 font-semibold"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
};
