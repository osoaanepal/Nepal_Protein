import { connectDB } from '../config/db.js';
import { BusinessSettings } from '../models/BusinessSettings.js';

/**
 * Idempotent migration script to normalize DFTQC quality standards compliance
 * in BusinessSettings while safely preserving backward compatibility.
 */
export const migrateDftqc = async () => {
  try {
    console.log('[Migration] Connecting to database...');
    await connectDB();

    const settings = await BusinessSettings.findOne();
    if (!settings) {
      console.log('[Migration] No BusinessSettings document found. Nothing to migrate.');
      return;
    }

    console.log('[Migration] Inspecting BusinessSettings document...');
    let modified = false;

    // Check if legacy nablCertification exists or dftqcCertification needs normalization
    const legacy = settings.nablCertification || {};
    const current = settings.dftqcCertification || {};

    // Base object merged from current or legacy
    const source = {
      enabled: current.enabled ?? legacy.enabled ?? true,
      certificationName: current.certificationName || legacy.certificationName || 'DFTQC Quality Standards & Compliance',
      laboratoryName: current.laboratoryName || legacy.laboratoryName || 'DFTQC Quality Guidelines Aligned',
      certificateNumber: current.certificateNumber || legacy.certificateNumber || '',
      qualityScope: current.qualityScope || legacy.qualityScope || current.accreditationScope || legacy.accreditationScope || 'Nutritional Analysis, Purity Verification & Heavy Metals Testing',
      accreditationScope: current.accreditationScope || legacy.accreditationScope || 'Nutritional Analysis, Purity Verification & Heavy Metals Testing',
      validFrom: current.validFrom || legacy.validFrom || null,
      validUntil: current.validUntil || legacy.validUntil || null,
      certificateDocUrl: current.certificateDocUrl || legacy.certificateDocUrl || '',
      certificateLogoUrl: current.certificateLogoUrl || legacy.certificateLogoUrl || '',
      shortDescription: current.shortDescription || legacy.shortDescription || "OSOAA products follow strict quality testing guidelines aligned with Nepal's Department of Food Technology and Quality Control (DFTQC) standards for authentic protein concentration, absence of heavy metals, and pure nutrition.",
      trustBadges: (current.trustBadges?.length > 0 ? current.trustBadges : legacy.trustBadges) || [
        'DFTQC Food Quality Standards Aligned',
        '100% Authentic Supplements',
        'Direct Sourcing & Genuine Batches',
        'Zero Banned Substances Tested',
        'Secure Payments with eSewa & COD'
      ]
    };

    // Clean any legacy NABL wording or fabricated reference numbers
    if (/nabl/i.test(source.certificationName)) {
      source.certificationName = 'DFTQC Quality Standards & Compliance';
      modified = true;
    }
    if (/nabl/i.test(source.laboratoryName) || source.laboratoryName === 'DFTQC Compliant Quality Testing Standards') {
      source.laboratoryName = 'DFTQC Quality Guidelines Aligned';
      modified = true;
    }
    if (source.certificateNumber === 'DFTQC-QC-8892-2024' || source.certificateNumber === 'NABL-TC-8892-2024') {
      // Remove unverified placeholder certificate numbers
      source.certificateNumber = '';
      modified = true;
    }

    source.trustBadges = source.trustBadges.map((badge) => {
      if (/nabl/i.test(badge)) {
        modified = true;
        return 'DFTQC Food Quality Standards Aligned';
      }
      return badge;
    });

    if (/nabl/i.test(source.shortDescription)) {
      source.shortDescription = "OSOAA products follow strict quality testing guidelines aligned with Nepal's Department of Food Technology and Quality Control (DFTQC) standards for authentic protein concentration, absence of heavy metals, and pure nutrition.";
      modified = true;
    }

    settings.dftqcCertification = source;
    settings.nablCertification = source; // sync for backward compatibility

    // Also sanitize announcementBar if it had old 3,500 free delivery text
    if (settings.announcementBar?.text && /3,?500/i.test(settings.announcementBar.text)) {
      settings.announcementBar.text = '100% Authentic Wellness & Nutrition';
      modified = true;
    }

    await settings.save();
    console.log('[Migration] DFTQC Quality Standards normalized successfully in BusinessSettings document.');
  } catch (error) {
    console.error('[Migration Error]:', error.message);
  }
};

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('migrateDftqc.js')) {
  migrateDftqc().then(() => {
    console.log('[Migration] Finished.');
    process.exit(0);
  });
}
