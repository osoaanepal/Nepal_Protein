import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SEO } from '../../components/seo/SEO';
import { buildFaqSchema } from '../../utils/seoSchemas';

export const FaqPage = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How do I know OSOAA supplements are 100% authentic?',
      a: 'All OSOAA products are batch-tracked, factory sealed, and tested under strict DFTQC quality standards for verified protein concentration, zero amino spiking, and absence of heavy metals.'
    },
    {
      q: 'What payment methods do you accept in Nepal?',
      a: 'We accept secure instant payments via eSewa digital wallet (with automated server-side verification) as well as Cash on Delivery (COD) across all serviceable locations in Nepal.'
    },
    {
      q: 'How long does delivery take inside Kathmandu and outside valley?',
      a: 'Inside Kathmandu Valley (Kathmandu, Lalitpur, Bhaktapur): Delivery takes 1–2 business days. Outside Kathmandu across all 7 provinces: Delivery typically takes 2–4 business days via our courier partners.'
    },
    {
      q: 'How are delivery charges calculated?',
      a: 'Delivery charges are calculated based on your selected district in Nepal and applied only once per order, regardless of product quantity.'
    },
    {
      q: 'Can I track my order online?',
      a: 'Yes! Simply click on "Track Order" on the top navigation bar and enter your Order Number (e.g. OSO-202609-XXXX) along with your 10-digit mobile number for real-time dispatch updates.'
    }
  ];

  const faqSchema = buildFaqSchema(faqs);
  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Frequently Asked Questions', item: '/faq' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-white min-h-[75vh]">
      <SEO
        title="Frequently Asked Questions (FAQ) | Supplements Nepal"
        description="Find answers to common questions regarding supplement authenticity, DFTQC testing, delivery timelines across Nepal, and payment methods."
        canonical="/faq"
        breadcrumbs={breadcrumbs}
        jsonLd={faqSchema}
      />
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Help Center</span>
        <h1 className="text-3xl sm:text-4xl font-black text-black">Frequently Asked Questions</h1>
        <p className="text-xs sm:text-sm text-slate-500">Everything you need to know about purchasing and consuming authentic supplements with OSOAA.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden transition shadow-sm"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-orange-600 transition"
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openIdx === idx ? 'rotate-180 text-orange-600' : 'text-slate-400'}`} />
            </button>
            {openIdx === idx && (
              <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
