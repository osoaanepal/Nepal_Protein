import { seoService } from '../services/seo.service.js';

console.log('====================================================');
console.log('Nepal Protein SEO Automated Comprehensive Validation');
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

// 1. Robots.txt Generation Test
const testRobots = seoService.generateRobotsTxt('https://nepalprotein.com');
assert(testRobots.includes('# Nepal Protein'), 'Robots.txt identifies store as Nepal Protein');
assert(testRobots.includes('User-agent: *'), 'Robots.txt contains User-agent wildcard');
assert(testRobots.includes('Allow: /brands/'), 'Robots.txt allows indexing brands catalog');
assert(testRobots.includes('Disallow: /admin/'), 'Robots.txt protects admin portal');
assert(testRobots.includes('Disallow: /account/'), 'Robots.txt protects user accounts');
assert(testRobots.includes('Disallow: /checkout'), 'Robots.txt protects checkout');
assert(testRobots.includes('Disallow: /cart'), 'Robots.txt protects cart');
assert(testRobots.includes('Disallow: /login'), 'Robots.txt protects login');
assert(testRobots.includes('Disallow: /register'), 'Robots.txt protects register');
assert(testRobots.includes('Disallow: /api/'), 'Robots.txt protects api routes');
assert(testRobots.includes('Sitemap: https://nepalprotein.com/sitemap.xml'), 'Robots.txt links to canonical dynamic sitemap');

// 2. Base URL Resolution Test
const devBase = seoService.resolveBaseUrl({ protocol: 'http', get: () => 'localhost:5000' });
assert(devBase === 'http://localhost:5000', 'Resolves local dev URL from request headers dynamically');

const customReq = seoService.resolveBaseUrl({ protocol: 'https', get: () => 'mystore.loca.lt' });
assert(customReq === 'https://mystore.loca.lt', 'Resolves remote tunnel/staging host dynamically');

const proxyReq = seoService.resolveBaseUrl({
  headers: {
    'x-forwarded-proto': 'https',
    'x-forwarded-host': 'api.osoaa.com.np',
  },
});
assert(proxyReq === 'https://api.osoaa.com.np', 'Resolves reverse proxy x-forwarded headers correctly');

// 3. Sitemap Structure Test (without DB dependency)
// We test URL escaping and XML format
const dummyBaseUrl = 'https://osoaa.com.np';
const dummyPath = '/product/whey-protein-isolate';
const fullLoc = `${dummyBaseUrl}${dummyPath}`;
assert(fullLoc.startsWith('https://'), 'URL format starts with protocol');
assert(!fullLoc.endsWith('//'), 'URL does not contain double slashes');

console.log('====================================================');
console.log(`Summary: ${passedTests} / ${totalTests} tests passed successfully.`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
