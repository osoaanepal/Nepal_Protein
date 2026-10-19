import React from 'react';
import {
  ShieldCheck, CheckCircle2, Award, FlaskConical, Check
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export const DftqcTrustSection = () => {
  const { settings } = useSettingsStore();

  const dftqc = settings?.dftqcCertification || settings?.nablCertification;
  if (dftqc?.enabled === false) return null;

  const certName = dftqc?.certificationName || 'DFTQC Quality Standards & Compliance';
  const labName = dftqc?.laboratoryName || 'DFTQC Quality Guidelines Aligned';
  const certNumber = dftqc?.certificateNumber || '';
  const description = dftqc?.shortDescription || 'OSOAA products follow strict quality testing guidelines aligned with Nepal\'s Department of Food Technology and Quality Control (DFTQC) standards for authentic protein concentration, absence of heavy metals, and pure nutrition.';
  const badges = dftqc?.trustBadges?.length > 0 ? dftqc.trustBadges : [
    'DFTQC Food Quality Standards Aligned',
    '100% Genuine & Authentic Batches',
    'Zero Banned Substances',
    'Heavy Metals Tested & Cleared',
    'Fast Nationwide Delivery Across Nepal',
  ];

  return (
    <section className="py-16 bg-[#E5E7EB] text-black relative overflow-hidden">

      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Text & Quality Standards Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-300 text-orange-600 text-xs font-bold uppercase tracking-wider shadow-sm">
              <FlaskConical className="w-4 h-4" />
              <span>Quality Assurance & Standards</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight leading-tight">
              Quality You Can Trust. <br />
              <span className="text-orange-600">
                Aligned with DFTQC Food Quality Standards.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
              {description}
            </p>

            {/* Factual Trust Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {badges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-gray-300 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-xs font-semibold text-black">{badge}</span>
                </div>
              ))}
            </div>

            {/* Quality Standard Reference Info Footer */}
            <div className="p-4 rounded-xl bg-gray-200 border border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Quality Standard</p>
                <p className="text-sm font-semibold text-black">{labName}</p>
                {certNumber && (
                  <p className="text-[11px] text-gray-600 font-mono mt-0.5">Reference: {certNumber}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-white bg-orange-500 px-3.5 py-2 rounded-xl shadow-orange-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Quality Compliance</span>
              </div>
            </div>

          </div>

          {/* Right Trust Verification Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-6">

              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-black text-white rounded-2xl shadow-md">
                    <Award className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black">Authenticity Seal</h3>
                    <p className="text-xs text-slate-500">Nepal Wellness & Nutrition</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-orange-50 text-orange-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p><strong className="text-black">Protein Concentration Verification:</strong> Verified protein percentage matching label claims.</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-orange-50 text-orange-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p><strong className="text-black">Heavy Metals & Toxins Screening:</strong> Zero harmful lead, arsenic, or mercury contamination.</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-orange-50 text-orange-600 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p><strong className="text-black">No Amino Spiking:</strong> Clean, non-spiked amino acid profile for clean lean muscle gains.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Primary Market: <strong className="text-black">Nepal</strong></span>
                <span>Currency: <strong className="text-black">NPR</strong></span>
              </div>

            </div>
          </div>

        </div>
      </div>


    </section>
  );
};

export const NablTrustSection = DftqcTrustSection;
