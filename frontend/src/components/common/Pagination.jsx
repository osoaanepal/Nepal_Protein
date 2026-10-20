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
 * Responsive Storefront Pagination Component
 *
 * @param {object} props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalPages - Total available pages
 * @param {function} props.onPageChange - Handler called with target page number
 * @param {number} [props.totalItems] - Total count of records (optional)
 * @param {number} [props.itemsPerPage] - Items per page for summary text (optional)
 * @param {string} [props.activeColor='black'] - Active button styling variant ('black' | 'orange')
 * @param {boolean} [props.showSummary=false] - Whether to show result range summary
 * @param {string} [props.className] - Additional container class names
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  itemsPerPage,
  activeColor = 'black',
  showSummary = false,
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

  const activeStyles =
    activeColor === 'orange'
      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
      : 'bg-black text-white shadow-sm';

  // Calculate item range for summary
  const startItem = itemsPerPage ? (safeCurrent - 1) * itemsPerPage + 1 : null;
  const endItem = itemsPerPage && totalItems ? Math.min(safeCurrent * itemsPerPage, totalItems) : null;

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 ${className}`}
    >
      {/* Optional Result Summary */}
      {showSummary && totalItems !== undefined && (
        <div className="text-xs text-slate-500 font-medium order-2 sm:order-1 text-center sm:text-left">
          {startItem && endItem ? (
            <span>
              Showing <strong className="text-slate-800">{startItem}</strong>–<strong className="text-slate-800">{endItem}</strong> of{' '}
              <strong className="text-slate-800">{totalItems}</strong> results
            </span>
          ) : (
            <span>
              Showing page <strong className="text-slate-800">{safeCurrent}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong> ({totalItems} total items)
            </span>
          )}
        </div>
      )}

      {/* Pagination Buttons Controls */}
      <div className={`flex items-center justify-center gap-1.5 sm:gap-2 order-1 sm:order-2 ${showSummary ? 'w-full sm:w-auto' : 'mx-auto'}`}>
        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => handleSelect(safeCurrent - 1)}
          disabled={!hasPrevious}
          aria-label="Previous Page"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm flex items-center gap-1 text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Desktop Page Numbers */}
        <div className="hidden sm:flex items-center gap-1.5">
          {desktopPages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
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
                aria-label={`Page ${p}`}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition shadow-sm ${
                  isActive
                    ? activeStyles
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Mobile Page Numbers (Fewer visible buttons to prevent horizontal overflow) */}
        <div className="flex sm:hidden items-center gap-1">
          {mobilePages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`mobile-ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
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
                aria-label={`Page ${p}`}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition shadow-sm ${
                  isActive
                    ? activeStyles
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => handleSelect(safeCurrent + 1)}
          disabled={!hasNext}
          aria-label="Next Page"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm flex items-center gap-1 text-xs font-semibold"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </nav>
  );
};
