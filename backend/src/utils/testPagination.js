import { getPaginationParams, buildPaginationMetadata } from './pagination.js';

console.log('====================================================');
console.log('Nepal Protein Pagination Utility Unit Verification');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

// 1. Default pagination params
const def = getPaginationParams({}, { defaultLimit: 12, maxLimit: 100 });
assert(def.page === 1, 'Default page is 1');
assert(def.limit === 12, 'Default limit is 12');
assert(def.skip === 0, 'Default skip is 0');

// 2. Custom valid page & limit
const custom = getPaginationParams({ page: '3', limit: '20' }, { defaultLimit: 10, maxLimit: 50 });
assert(custom.page === 3, 'Parsed page string to 3');
assert(custom.limit === 20, 'Parsed limit string to 20');
assert(custom.skip === 40, 'Calculated skip as (3 - 1) * 20 = 40');

// 3. Max limit boundary enforcement
const overLimit = getPaginationParams({ page: '1', limit: '500' }, { defaultLimit: 10, maxLimit: 100 });
assert(overLimit.limit === 100, 'Clamps limit exceeding maxLimit to 100');

// 4. Invalid, negative, and zero handling
const invalid = getPaginationParams({ page: '-5', limit: '0' }, { defaultLimit: 15, maxLimit: 100 });
assert(invalid.page === 1, 'Sanitizes negative page to 1');
assert(invalid.limit === 15, 'Sanitizes zero limit to defaultLimit 15');
assert(invalid.skip === 0, 'Skip is 0 for sanitized page 1');

const nanCase = getPaginationParams({ page: 'foo', limit: 'bar' });
assert(nanCase.page === 1, 'Sanitizes NaN page to 1');
assert(nanCase.limit === 12, 'Sanitizes NaN limit to defaultLimit 12');

// 5. Metadata calculation - single page
const meta1 = buildPaginationMetadata(8, 1, 12);
assert(meta1.currentPage === 1, 'Single page: currentPage is 1');
assert(meta1.totalPages === 1, 'Single page: totalPages is 1');
assert(meta1.totalItems === 8, 'Single page: totalItems is 8');
assert(meta1.hasNextPage === false, 'Single page: hasNextPage is false');
assert(meta1.hasPreviousPage === false, 'Single page: hasPreviousPage is false');
assert(meta1.page === 1 && meta1.pages === 1 && meta1.total === 8, 'Backward compatible keys present');

// 6. Metadata calculation - multi-page first page
const metaFirst = buildPaginationMetadata(45, 1, 10);
assert(metaFirst.totalPages === 5, '45 items @ 10/page = 5 totalPages');
assert(metaFirst.hasNextPage === true, 'Page 1 of 5 hasNextPage is true');
assert(metaFirst.hasPreviousPage === false, 'Page 1 of 5 hasPreviousPage is false');

// 7. Metadata calculation - middle page
const metaMid = buildPaginationMetadata(45, 3, 10);
assert(metaMid.currentPage === 3, 'Middle page is 3');
assert(metaMid.hasNextPage === true, 'Middle page hasNextPage is true');
assert(metaMid.hasPreviousPage === true, 'Middle page hasPreviousPage is true');

// 8. Metadata calculation - last page
const metaLast = buildPaginationMetadata(45, 5, 10);
assert(metaLast.currentPage === 5, 'Last page is 5');
assert(metaLast.hasNextPage === false, 'Last page hasNextPage is false');
assert(metaLast.hasPreviousPage === true, 'Last page hasPreviousPage is true');

// 9. Zero total items
const metaZero = buildPaginationMetadata(0, 1, 12);
assert(metaZero.totalPages === 1, 'Zero items: totalPages defaults to 1');
assert(metaZero.totalItems === 0, 'Zero items: totalItems is 0');
assert(metaZero.hasNextPage === false, 'Zero items: hasNextPage is false');
assert(metaZero.hasPreviousPage === false, 'Zero items: hasPreviousPage is false');

console.log('====================================================');
console.log(`Summary: ${passedTests} / ${totalTests} tests passed successfully.`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
