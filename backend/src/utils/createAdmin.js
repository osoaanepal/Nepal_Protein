import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

// Configure DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch {}

import { User } from '../models/User.js';
import { ENV } from '../config/env.js';

export const createOrUpdateAdmin = async () => {
  try {
    console.log('\n=============================================================');
    console.log('🚀 Nepal Protein Production Admin Provisioning Utility');
    console.log('=============================================================');

    const adminEmail = (process.env.ADMIN_EMAIL || ENV.ADMIN?.EMAIL || '').toLowerCase().trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || ENV.ADMIN?.PASSWORD || '').trim();
    const adminName = (process.env.ADMIN_NAME || ENV.ADMIN?.NAME || 'Nepal Protein Administrator').trim();
    let adminPhone = (process.env.ADMIN_PHONE || ENV.ADMIN?.PHONE || '').trim();
    if (!adminPhone) {
      adminPhone = '9801000001'; // Fallback valid 10-digit phone number if omitted
    }

    const mongoUri = process.env.MONGODB_URI || ENV.MONGODB_URI;

    // Safe Diagnostic Logs (NEVER logs sensitive credentials)
    console.log(`[Diagnostic] Environment loaded: ${Boolean(process.env.NODE_ENV || process.env.PORT) ? 'YES' : 'NO'}`);
    console.log(`[Diagnostic] Admin email configured: ${Boolean(adminEmail) ? 'YES' : 'NO'}`);
    console.log(`[Diagnostic] Admin password configured: ${Boolean(adminPassword) ? 'YES' : 'NO'}`);
    console.log(`[Diagnostic] MongoDB URI configured: ${Boolean(mongoUri) ? 'YES' : 'NO'}`);

    if (!adminEmail || !adminPassword) {
      console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in backend/.env.');
      process.exit(1);
    }

    if (adminPassword.length < 6) {
      console.error('❌ Error: ADMIN_PASSWORD must be at least 6 characters long.');
      process.exit(1);
    }

    console.log(`\nConnecting to MongoDB...`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Diagnostic] MongoDB connected: YES`);
    console.log(`[Diagnostic] Database Name: ${conn.connection.name}`);
    console.log(`[Diagnostic] User Collection: ${User.collection.name}`);

    // 1. Remove obsolete demo admin accounts if any exist
    const deleteResult = await User.deleteMany({
      email: {
        $in: ['admin@osoaa.com', 'demo-admin@osoaa.com'],
        $ne: adminEmail,
      },
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`[Cleanup] Removed ${deleteResult.deletedCount} obsolete demo account(s).`);
    }

    // 2. Check if owner account already exists
    let user = await User.findOne({ email: adminEmail }).select('+password');
    console.log(`[Diagnostic] Existing owner found in DB: ${Boolean(user) ? 'YES' : 'NO'}`);

    if (user) {
      console.log(`Updating existing account to verified Administrator...`);
      user.name = adminName;
      user.phone = adminPhone;
      user.role = 'admin';
      user.isActive = true;
      user.emailVerified = true;
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
      user.password = adminPassword; // Pre-save hook will hash it with bcrypt
      await user.save();
      console.log(`[Diagnostic] Updated User Document _id: ${user._id}`);
    } else {
      console.log(`Creating fresh verified Administrator document in MongoDB...`);
      user = await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword, // Pre-save hook will hash it with bcrypt
        role: 'admin',
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
      console.log(`[Diagnostic] Created User Document _id: ${user._id}`);
    }

    // 3. Independent Read Verification from Database
    console.log('\nRunning database persistence & password verification test...');
    const verifiedUser = await User.findOne({ email: adminEmail }).select('+password');
    if (!verifiedUser) {
      throw new Error('Verification failed: User document was not found in MongoDB after save.');
    }

    const isBcryptHash = verifiedUser.password && (verifiedUser.password.startsWith('$2a$') || verifiedUser.password.startsWith('$2b$'));
    const isPasswordValid = await bcrypt.compare(adminPassword, verifiedUser.password);

    console.log(`[Diagnostic] Verified document exists: YES`);
    console.log(`[Diagnostic] Verified role === 'admin': ${verifiedUser.role === 'admin' ? 'YES' : 'NO'}`);
    console.log(`[Diagnostic] Verified isActive === true: ${verifiedUser.isActive === true ? 'YES' : 'NO'}`);
    console.log(`[Diagnostic] Verified emailVerified === true: ${verifiedUser.emailVerified === true ? 'YES' : 'NO'}`);
    console.log(`[Diagnostic] Stored password is bcrypt hash: ${isBcryptHash ? 'YES' : 'NO'}`);
    console.log(`[Diagnostic] bcrypt.compare() validation: ${isPasswordValid ? 'PASS' : 'FAIL'}`);

    if (!isBcryptHash || !isPasswordValid || verifiedUser.role !== 'admin') {
      throw new Error('Security verification failed: User credentials or role did not validate.');
    }

    console.log('\n=============================================================');
    console.log('✅ OWNER ADMIN PERSISTED & VERIFIED SUCCESSFULLY!');
    console.log('=============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin Provisioning Error:', error);
    process.exit(1);
  }
};

createOrUpdateAdmin();
