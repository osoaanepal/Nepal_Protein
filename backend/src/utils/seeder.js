import mongoose from 'mongoose';
import dns from 'dns';
import slugify from 'slugify';
import { ENV } from '../config/env.js';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch {}
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { Banner } from '../models/Banner.js';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing collections if re-seeding
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Brand.deleteMany(),
      Product.deleteMany(),
      Coupon.deleteMany(),
      BusinessSettings.deleteMany(),
      Banner.deleteMany(),
    ]);

    // 1. Seed Business Settings
    console.log('Seeding Business Settings & DFTQC configuration...');
    await BusinessSettings.create({
      businessName: 'Nepal Protein',
      category: 'Sports Nutrition & Fitness Supplements',
      tagline: 'Authentic Sports Nutrition & Fitness Supplements',
      contact: {
        email: 'osoaanepal@gmail.com',
        phone: '+977-9802949872',
        secondaryPhone: '+977-01-4432100',
        address: 'Birgunj 10 Ashokbatika, Parsa, Nepal',
        mapsUrl: 'https://maps.google.com',
      },
      socialLinks: {
        facebook: 'https://facebook.com/osoaa.nepal',
        instagram: 'https://instagram.com/osoaa.nepal',
        tiktok: 'https://tiktok.com/@osoaa.nepal',
        youtube: 'https://youtube.com/@osoaanepal',
      },
      deliverySettings: {
        districtCharges: {
          Kathmandu: 100,
          Lalitpur: 100,
          Bhaktapur: 100,
          Jhapa: 100,
          Morang: 120,
          Sunsari: 120,
          Kaski: 120,
          Chitwan: 120,
        },
        estimatedDays: '2-4 Business Days',
      },
      paymentSettings: {
        codEnabled: true,
        esewaEnabled: true,
      },
      dftqcCertification: {
        enabled: true,
        certificationName: 'DFTQC Quality Standards & Compliance',
        laboratoryName: 'DFTQC Quality Guidelines Aligned',
        certificateNumber: '',
        accreditationScope: 'Nutritional Analysis, Purity Verification & Heavy Metals Testing',
        shortDescription: 'OSOAA products follow strict quality testing guidelines aligned with Nepal\'s Department of Food Technology and Quality Control (DFTQC) standards for authentic protein concentration, absence of heavy metals, and pure nutrition.',
        trustBadges: [
          'DFTQC Food Quality Standards Aligned',
          '100% Genuine & Authentic Batches',
          'Zero Banned Substances',
          'Heavy Metals Tested & Cleared',
          'Fast Nationwide Delivery Across Nepal',
        ],
      },
      nablCertification: {
        enabled: true,
        certificationName: 'DFTQC Quality Standards & Compliance',
        laboratoryName: 'DFTQC Quality Guidelines Aligned',
        certificateNumber: '',
        accreditationScope: 'Nutritional Analysis, Purity Verification & Heavy Metals Testing',
        shortDescription: 'OSOAA products follow strict quality testing guidelines aligned with Nepal\'s Department of Food Technology and Quality Control (DFTQC) standards for authentic protein concentration, absence of heavy metals, and pure nutrition.',
        trustBadges: [
          'DFTQC Food Quality Standards Aligned',
          '100% Genuine & Authentic Batches',
          'Zero Banned Substances',
          'Heavy Metals Tested & Cleared',
          'Fast Nationwide Delivery Across Nepal',
        ],
      },
      announcementBar: {
        enabled: true,
        text: '100% Authentic Wellness & Nutrition',
        link: '/shop',
      },
    });

    // 2. Seed Users (Admin & Customer)
    console.log('Seeding Users...');
    if (ENV.ADMIN?.EMAIL && ENV.ADMIN?.PASSWORD) {
      await User.create({
        name: ENV.ADMIN.NAME || 'OSOAA Administrator',
        email: ENV.ADMIN.EMAIL.toLowerCase().trim(),
        phone: ENV.ADMIN.PHONE || '9801000001',
        password: ENV.ADMIN.PASSWORD,
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
      console.log(`Admin user configured from environment: ${ENV.ADMIN.EMAIL}`);
    } else {
      console.log('No ADMIN_EMAIL/ADMIN_PASSWORD environment variables found. Run "npm run create-admin" to provision the owner account.');
    }

    const customerUser = await User.create({
      name: 'Rohan Shrestha',
      email: 'customer@osoaa.com',
      phone: '9841234567',
      password: 'CustomerPassword@123',
      role: 'customer',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      addresses: [{
        fullName: 'Rohan Shrestha',
        phone: '9841234567',
        province: 'Bagmati',
        district: 'Kathmandu',
        municipality: 'Kathmandu Metropolitan',
        ward: '03',
        streetAddress: 'Lazimpat, Near Radisson Hotel',
        landmark: 'Opposite Standard Chartered',
        isDefault: true,
      }]
    });

    // 3. Seed Categories
    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Protein', description: 'Premium Whey Isolate, Concentrate & Plant Proteins for lean muscle growth.' },
      { name: 'Creatine', description: 'Micronized Creatine Monohydrate for explosive power, strength and recovery.' },
      { name: 'Pre-Workout', description: 'High-energy pre-workout formulas for extreme pump, focus and endurance.' },
      { name: 'Mass Gainer', description: 'High-calorie, protein-rich mass gainers for hard-gainers.' },
      { name: 'Amino Acids & BCAA', description: 'Essential amino acids and BCAAs to accelerate intra-workout recovery.' },
      { name: 'Vitamins & Daily Wellness', description: 'Multivitamins, Fish Oil Omega-3, Ashwagandha and immunity boosters.' },
      { name: 'Gym Accessories & Shakers', description: 'Durable shaker bottles, lifting straps, wrist wraps and gym belts.' },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const slug = slugify(cat.name, { lower: true, strict: true });
      const doc = await Category.create({
        name: cat.name,
        slug,
        description: cat.description,
        isActive: true,
        image: {
          url: `https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80`,
          publicId: '',
        }
      });
      categoryMap[cat.name] = doc;
    }

    // 3.5 Seed Brands
    console.log('Seeding Brands...');
    const osoaaBrand = await Brand.create({
      name: 'OSOAA',
      slug: 'osoaa',
      description: 'Authentic sports nutrition and wellness brand engineered for pure athletic performance, muscle recovery, and overall vitality.',
      website: 'https://osoaa.com',
      isActive: true,
      isFeatured: true,
      seoTitle: 'OSOAA Supplements Nepal | Authentic Whey Protein & Creatine',
      seoDescription: 'Shop genuine OSOAA supplements in Nepal. 100% authentic whey protein isolate, micronized creatine, and pre-workout delivered nationwide.',
    });

    // 4. Seed Products
    console.log('Seeding Products...');
    const products = [
      {
        name: 'OSOAA 100% Pure Whey Protein Isolate',
        brand: osoaaBrand._id,
        sku: 'OSO-WPI-001',
        category: categoryMap['Protein']._id,
        subCategory: 'Whey Isolate',
        shortDescription: 'Ultra-pure whey protein isolate with 27g protein per scoop, 0g added sugar, and fast digestive enzymes.',
        description: 'OSOAA 100% Pure Whey Isolate delivers ultra-filtered, premium whey protein designed for athletes, fitness enthusiasts, and individuals aiming for clean lean muscle definition. Each serving provides 27 grams of fast-acting protein with virtually zero fat and carbs. Batch-tested for quality and authenticity.',
        price: 7499,
        compareAtPrice: 8999,
        stock: 45,
        lowStockThreshold: 5,
        weight: '2 kg (4.4 lbs)',
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: true,
        status: 'published',
        tags: ['whey isolate', 'protein', 'lean muscle', 'post workout', 'osoaa'],
        ratingAverage: 4.9,
        ratingCount: 28,
        soldCount: 142,
        images: [
          { url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800&auto=format&fit=crop&q=80', isPrimary: false }
        ],
        variants: [
          { variantName: 'Rich Belgian Chocolate / 2 kg', flavor: 'Rich Belgian Chocolate', weight: '2 kg', price: 7499, compareAtPrice: 8999, stock: 25, sku: 'OSO-WPI-CHOC-2KG' },
          { variantName: 'Gourmet Vanilla Cream / 2 kg', flavor: 'Gourmet Vanilla Cream', weight: '2 kg', price: 7499, compareAtPrice: 8999, stock: 20, sku: 'OSO-WPI-VAN-2KG' },
        ],
        ingredients: ['Whey Protein Isolate 90%', 'Natural Cocoa Powder', 'Digestive Enzyme Blend (Protease, Lactase)', 'Sunflower Lecithin', 'Stevia Leaf Extract'],
        nutritionInformation: [
          { nutrient: 'Energy', amountPerServing: '120 kcal', percentageDV: '6%' },
          { nutrient: 'Protein', amountPerServing: '27 g', percentageDV: '54%' },
          { nutrient: 'Total Carbohydrates', amountPerServing: '1 g', percentageDV: '<1%' },
          { nutrient: 'Total Fat', amountPerServing: '0.5 g', percentageDV: '1%' },
          { nutrient: 'BCAAs', amountPerServing: '6.2 g', percentageDV: '-' },
        ],
        usageInstructions: 'Mix 1 scoop (30g) with 200-250ml of cold water or milk in a shaker. Shake vigorously for 20 seconds. Best consumed first thing in the morning or immediately post-workout.',
      },
      {
        name: 'OSOAA Pure Micronized Creatine Monohydrate 200 Mesh',
        sku: 'OSO-CRE-002',
        category: categoryMap['Creatine']._id,
        subCategory: 'Creatine Monohydrate',
        shortDescription: '100% Ultra-micronized 200-mesh Creatine Monohydrate for explosive power, ATP resynthesis, and muscle cell volumization.',
        description: 'OSOAA Micronized Creatine Monohydrate is unflavored, pure 200-mesh fine powder that dissolves instantly in water or juice. Supports heavy lifting output, sprint speed, and cellular hydration.',
        price: 2499,
        compareAtPrice: 2999,
        stock: 60,
        lowStockThreshold: 10,
        weight: '300 g (100 Servings)',
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        status: 'published',
        tags: ['creatine', 'strength', 'power', 'micronized', 'unflavored'],
        ratingAverage: 5.0,
        ratingCount: 42,
        soldCount: 310,
        images: [
          { url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&auto=format&fit=crop&q=80', isPrimary: true },
        ],
        variants: [
          { variantName: 'Unflavored / 300g (100 Servings)', flavor: 'Unflavored', weight: '300 g', price: 2499, compareAtPrice: 2999, stock: 60, sku: 'OSO-CRE-300G' },
        ],
        ingredients: ['100% Pure Micronized Creatine Monohydrate (200 Mesh)'],
        nutritionInformation: [
          { nutrient: 'Creatine Monohydrate', amountPerServing: '3000 mg', percentageDV: '-' },
        ],
        usageInstructions: 'Mix 1 scoop (3g) with 200ml of water, fruit juice, or your protein shake daily. Maintain adequate daily water intake (3-4 litres).',
      },
      {
        name: 'OSOAA NitroVex High-Energy Pre-Workout',
        sku: 'OSO-PRE-003',
        category: categoryMap['Pre-Workout']._id,
        subCategory: 'High Stimulant',
        shortDescription: 'Laser focus, skin-tearing pumps and clean sustained energy with Beta-Alanine, L-Citrulline, and Anhydrous Caffeine.',
        description: 'Engineered for intense training sessions, NitroVex delivers 300mg of caffeine, 4000mg L-Citrulline Malate, and 3200mg Beta-Alanine to crush fatigue and elevate workout performance.',
        price: 3899,
        compareAtPrice: 4500,
        stock: 30,
        lowStockThreshold: 5,
        weight: '300 g (30 Servings)',
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        status: 'published',
        tags: ['pre workout', 'energy', 'pump', 'caffeine', 'beta alanine'],
        ratingAverage: 4.8,
        ratingCount: 19,
        soldCount: 88,
        images: [
          { url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=80', isPrimary: true },
        ],
        variants: [
          { variantName: 'Blue Raspberry / 30 Servings', flavor: 'Blue Raspberry', weight: '300 g', price: 3899, compareAtPrice: 4500, stock: 15, sku: 'OSO-PRE-BLUE-30' },
          { variantName: 'Sour Green Apple / 30 Servings', flavor: 'Sour Green Apple', weight: '300 g', price: 3899, compareAtPrice: 4500, stock: 15, sku: 'OSO-PRE-APPL-30' },
        ],
        ingredients: ['L-Citrulline Malate 2:1', 'Beta-Alanine', 'Anhydrous Caffeine', 'L-Tyrosine', 'Himalayan Pink Salt', 'Natural Flavorings'],
        nutritionInformation: [
          { nutrient: 'L-Citrulline Malate', amountPerServing: '4000 mg', percentageDV: '-' },
          { nutrient: 'Beta-Alanine', amountPerServing: '3200 mg', percentageDV: '-' },
          { nutrient: 'Caffeine Anhydrous', amountPerServing: '300 mg', percentageDV: '-' },
        ],
        usageInstructions: 'Mix 1 scoop (10g) in 250ml of cold water 20-30 minutes before exercise. Do not exceed 1 scoop in a 24-hour period.',
      },
      {
        name: 'OSOAA Pro Shaker Bottle 700ml (BPA Free)',
        sku: 'OSO-SHK-004',
        category: categoryMap['Gym Accessories & Shakers']._id,
        subCategory: 'Shaker Bottles',
        shortDescription: '100% Leak-proof, BPA-free matte finish shaker with surgical steel wire blending ball and measurement markings.',
        description: 'Durable, odorless, ergonomic shaker bottle engineered for smooth, lump-free protein shakes on the go.',
        price: 850,
        compareAtPrice: 1100,
        stock: 80,
        lowStockThreshold: 10,
        weight: '700 ml',
        isFeatured: false,
        isBestSeller: true,
        isNewArrival: false,
        status: 'published',
        tags: ['shaker', 'bottle', 'gym accessory', 'bpa free'],
        ratingAverage: 4.9,
        ratingCount: 35,
        soldCount: 220,
        images: [
          { url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80', isPrimary: true },
        ],
        variants: [
          { variantName: 'Matte Stealth Black / 700ml', flavor: 'Stealth Black', size: '700ml', price: 850, compareAtPrice: 1100, stock: 50, sku: 'OSO-SHK-BLK' },
          { variantName: 'Emerald Green / 700ml', flavor: 'Emerald Green', size: '700ml', price: 850, compareAtPrice: 1100, stock: 30, sku: 'OSO-SHK-GRN' },
        ],
        ingredients: ['BPA-Free Food Grade Polypropylene', 'Surgical Stainless Steel Whisk Ball'],
        nutritionInformation: [],
        usageInstructions: 'Rinse with warm soapy water after every use. Top-rack dishwasher safe.',
      },
      {
        name: 'OSOAA Triple Strength Omega-3 Fish Oil (1000mg EPA/DHA)',
        sku: 'OSO-OMG-005',
        category: categoryMap['Vitamins & Daily Wellness']._id,
        subCategory: 'Essential Fatty Acids',
        shortDescription: 'Molecularly distilled deep-sea fish oil for heart, joint mobility, brain clarity, and muscle recovery.',
        description: 'Ultra-purified enteric-coated softgels with zero fishy aftertaste. Tested for heavy metals and mercury.',
        price: 1899,
        compareAtPrice: 2400,
        stock: 50,
        lowStockThreshold: 8,
        weight: '60 Softgels',
        isFeatured: true,
        isBestSeller: false,
        isNew: true,
        status: 'published',
        tags: ['omega 3', 'fish oil', 'epa dha', 'joints', 'wellness'],
        ratingAverage: 4.7,
        ratingCount: 15,
        soldCount: 95,
        images: [
          { url: 'https://images.unsplash.com/photo-1550572017-ed200f545dec?w=800&auto=format&fit=crop&q=80', isPrimary: true },
        ],
        variants: [
          { variantName: '60 Enteric Softgels', weight: '60 Softgels', price: 1899, compareAtPrice: 2400, stock: 50, sku: 'OSO-OMG-60SG' },
        ],
        ingredients: ['Purified Deep Sea Fish Oil', 'Gelatin', 'Glycerin', 'Purified Water', 'Natural Tocopherols'],
        nutritionInformation: [
          { nutrient: 'Fish Oil Concentrate', amountPerServing: '1250 mg', percentageDV: '-' },
          { nutrient: 'EPA (Eicosapentaenoic Acid)', amountPerServing: '550 mg', percentageDV: '-' },
          { nutrient: 'DHA (Docosahexaenoic Acid)', amountPerServing: '450 mg', percentageDV: '-' },
        ],
        usageInstructions: 'Take 1 to 2 softgels daily with meals, or as advised by your healthcare professional.',
      }
    ];

    for (const prod of products) {
      let slug = slugify(prod.name, { lower: true, strict: true });
      await Product.create({
        brand: prod.brand || osoaaBrand._id,
        ...prod,
        slug,
      });
    }

    // 6. Seed Coupons
    console.log('Seeding Coupons...');
    await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 2000,
        maxDiscountAmount: 1000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'FITNESS500',
        discountType: 'FIXED',
        discountValue: 500,
        minOrderAmount: 4000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 200,
        perUserLimit: 1,
        isActive: true,
      }
    ]);

    // 7. Seed Hero Banners
    console.log('Seeding Hero Banners...');
    await Banner.create([
      {
        title: 'Elevate Your Fitness Journey',
        subtitle: '100% Authentic, Lab-Tested Supplements Formulated for Maximum Purity & Peak Performance.',
        badge: 'DFTQC Quality Standards',
        ctaText: 'Shop Best Sellers',
        ctaLink: '/shop?sortBy=popular',
        displayOrder: 1,
        isActive: true,
        desktopImage: {
          url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&auto=format&fit=crop&q=80',
          publicId: '',
        },
        mobileImage: {
          url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
          publicId: '',
        },
      }
    ]);

    console.log('\n=============================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`👤 Customer Account: customer@osoaa.com`);
    console.log(`🎟️ Active Coupons: WELCOME10 (10% off), FITNESS500 (Rs. 500 off)`);
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
