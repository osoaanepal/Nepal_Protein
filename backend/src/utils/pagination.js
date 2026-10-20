/**
 * Standardized pagination utilities for Nepal Protein API
 */

/**
 * Parse and validate pagination query parameters
 * @param {object} query - Express request query object (req.query)
 * @param {object} [options]
 * @param {number} [options.defaultLimit=12] - Default items per page
 * @param {number} [options.maxLimit=100] - Hard upper limit on page size
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const getPaginationParams = (query = {}, { defaultLimit = 12, maxLimit = 100 } = {}) => {
  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit, 10);

  const page = (!isNaN(rawPage) && rawPage > 0) ? rawPage : 1;
  const limit = (!isNaN(rawLimit) && rawLimit > 0) ? Math.min(rawLimit, maxLimit) : defaultLimit;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build complete pagination metadata including both new standard keys and legacy keys
 * @param {number} total - Total records matching the filter query
 * @param {number} page - Current active page number
 * @param {number} limit - Active items per page limit
 * @returns {object} Standard pagination metadata
 */
export const buildPaginationMetadata = (total = 0, page = 1, limit = 12) => {
  const safeTotal = Math.max(0, parseInt(total, 10) || 0);
  const safeLimit = Math.max(1, parseInt(limit, 10) || 12);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  return {
    // New standardized metadata
    currentPage,
    totalPages,
    totalItems: safeTotal,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,

    // Legacy keys for backward compatibility with existing consumers
    page: currentPage,
    pages: totalPages,
    limit: safeLimit,
    total: safeTotal,
  };
};
