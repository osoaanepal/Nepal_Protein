import React from 'react';
import { ShieldCheck, FlaskConical, Target } from 'lucide-react';
import { DftqcTrustSection } from '../../components/trust/DftqcTrustSection';
import { SEO } from '../../components/seo/SEO';
import { buildOrganizationSchema } from '../../utils/seoSchemas';

export const AboutPage = () => {
  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'About Nepal Protein', item: '/about' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 bg-white min-h-[75vh]">
      <SEO
        title="About Us | Authenticity & Multi-Brand Quality Standards"
        description="Learn about Nepal Protein's commitment to 100% authentic fitness nutrition, trusted multi-brand sports supplements including OSOAA, strict DFTQC testing standards, and nationwide supplement delivery."
        canonical="/about"
        breadcrumbs={breadcrumbs}
        jsonLd={buildOrganizationSchema()}
      />
      
      {/* Hero Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">About Nepal Protein</span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
          Nepal's Premier Destination for Authentic Nutrition & Supplements.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Founded to eliminate counterfeit risks across Nepal's fitness community, Nepal Protein provides 100% genuine sports supplements from trusted world-class manufacturers—including OSOAA—backed by verified laboratory and quality standards.
        </p>
      </div>

      {/* Core Mission & Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-black">100% Guaranteed Authenticity</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every product batch is sealed, imported directly from authentic sources, and tracked with individual lot numbers to ensure zero adulteration.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-black">DFTQC Quality Standards</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We adhere to DFTQC food safety and testing guidelines to verify protein content, heavy metals safety, and zero banned substance contamination.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-black">Athlete-Centric Formulations</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Designed for real human physiology with digestive enzymes to eliminate bloating and maximize protein bio-utilization.
          </p>
        </div>
      </div>

      {/* DFTQC Standards Section */}
      <DftqcTrustSection />

    </div>
  );
};
