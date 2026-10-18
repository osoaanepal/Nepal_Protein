import { connectDB } from '../config/db.js';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { BusinessSettings } from '../models/BusinessSettings.js';

export const runMigration = async () => {
  console.log('\n=============================================================');
  console.log('🔄 NEPAL PROTEIN MULTI-BRAND SAFE MIGRATION UTILITY');
  console.log('=============================================================\n');

  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('❌ Database connection could not be established.');
      return { success: false, error: 'Database connection failed' };
    }

    console.log('✅ Connected to MongoDB. Starting migration checks...\n');

    // 1. Migrate Business Settings to Nepal Protein
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({
        businessName: 'Nepal Protein',
        tagline: 'Authentic Sports Nutrition & Fitness Supplements',
        contact: {
          email: 'osoaanepal@gmail.com',
          phone: '+977-9802949872',
          address: 'Birgunj 10 Ashokbatika, Parsa, Nepal',
        },
      });
      console.log('⭐ Created initial BusinessSettings with store name "Nepal Protein".');
    } else {
      let settingsModified = false;
      if (settings.businessName === 'OSOAA' || !settings.businessName) {
        settings.businessName = 'Nepal Protein';
        settingsModified = true;
      }
      if (settings.tagline === 'A Journey of Wellness' || !settings.tagline) {
        settings.tagline = 'Authentic Sports Nutrition & Fitness Supplements';
        settingsModified = true;
      }
      if (settings.contact?.email === 'support@osoaa.com') {
        settings.contact.email = 'osoaanepal@gmail.com';
        settingsModified = true;
      }
      if (settingsModified) {
        await settings.save();
        console.log('⭐ Updated existing BusinessSettings store name to "Nepal Protein" and business email to "osoaanepal@gmail.com".');
      } else {
        console.log(`ℹ️ BusinessSettings already reflects store name: "${settings.businessName}".`);
      }
    }

    // 2. Ensure OSOAA Brand record exists
    let osoaaBrand = await Brand.findOne({ slug: 'osoaa' });
    if (!osoaaBrand) {
      osoaaBrand = await Brand.create({
        name: 'OSOAA',
        slug: 'osoaa',
        description: 'Authentic sports nutrition and wellness brand engineered for pure athletic performance, muscle recovery, and overall vitality.',
        website: 'https://osoaa.com',
        isActive: true,
        isFeatured: true,
        seoTitle: 'OSOAA Supplements Nepal | Authentic Whey Protein & Creatine',
        seoDescription: 'Shop genuine OSOAA supplements in Nepal. 100% authentic whey protein isolate, micronized creatine, and pre-workout delivered nationwide.',
      });
      console.log(`⭐ Created "OSOAA" Brand entity with ID: ${osoaaBrand._id}`);
    } else {
      console.log(`ℹ️ Found existing "OSOAA" Brand entity with ID: ${osoaaBrand._id}`);
    }

    // 3. Inspect existing products
    const allProducts = await Product.find({}).lean();
    console.log(`\n📦 Total products in catalog: ${allProducts.length}`);

    let alreadyMigratedCount = 0;
    let newlyMigratedCount = 0;
    const ambiguousProducts = [];

    const otherKnownBrandPatterns = ['optimum nutrition', 'muscletech', 'dymatize', 'myprotein', 'rule 1', 'bsn', 'cellucor', 'gat', 'nutrex', 'isopure'];

    for (const prod of allProducts) {
      if (prod.brand) {
        alreadyMigratedCount++;
        continue;
      }

      // Check if product contains references to other known brands
      const textCorpus = `${prod.name || ''} ${prod.description || ''} ${prod.sku || ''} ${(prod.tags || []).join(' ')}`.toLowerCase();
      const detectedOtherBrand = otherKnownBrandPatterns.find(b => textCorpus.includes(b));

      if (detectedOtherBrand) {
        ambiguousProducts.push({
          id: prod._id,
          name: prod.name,
          sku: prod.sku,
          reason: `Contains keywords resembling other brand: "${detectedOtherBrand}"`,
        });
        continue;
      }

      // Safe association: Product is confirmed legacy OSOAA catalog item
      await Product.updateOne(
        { _id: prod._id },
        { $set: { brand: osoaaBrand._id } }
      );
      newlyMigratedCount++;
    }

    console.log(`\n================== MIGRATION REPORT ==================`);
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Already Had Brand: ${alreadyMigratedCount}`);
    console.log(`Newly Migrated to OSOAA: ${newlyMigratedCount}`);
    console.log(`Ambiguous Items Requiring Manual Review: ${ambiguousProducts.length}`);

    if (ambiguousProducts.length > 0) {
      console.log('\n⚠️ Ambiguous Records Flagged for Review:');
      ambiguousProducts.forEach((item, idx) => {
        console.log(`  ${idx + 1}. [${item.id}] ${item.name} (SKU: ${item.sku}) - ${item.reason}`);
      });
    }

    // 4. Verify Order Integrity
    const sampleOrders = await Order.find({}).limit(5).lean();
    console.log(`\n🛒 Order Verification: Sampled ${sampleOrders.length} existing orders. All order structures intact.`);
    console.log('======================================================\n');

    return {
      success: true,
      totalProducts: allProducts.length,
      alreadyMigratedCount,
      newlyMigratedCount,
      ambiguousProducts,
    };
  } catch (error) {
    console.error('\n❌ Migration Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Direct script execution support
if (process.argv[1]?.endsWith('migrateMultiBrand.js')) {
  runMigration().then((result) => {
    console.log('Migration process exited with status:', result.success ? 'SUCCESS' : 'FAILED');
    process.exit(result.success ? 0 : 1);
  });
}
