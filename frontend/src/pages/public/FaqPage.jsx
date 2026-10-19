import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SEO } from '../../components/seo/SEO';
import { buildFaqSchema } from '../../utils/seoSchemas';

export const FaqPage = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [

    {
      q: 'How do I know the supplements sold by Nepal Protein are authentic?',
      a: 'Nepal Protein aims to provide genuine supplements from trusted brands and reliable suppliers. Products are supplied in their original packaging and should have intact factory seals, batch numbers, and expiry dates where applicable. Customers are encouraged to check product labels and packaging upon delivery and contact our support team if they notice any concerns.'
    },
    {
      q: 'What payment methods do you accept in Nepal?',
      a: 'Nepal Protein accepts payments through eSewa and Cash on Delivery (COD) in serviceable locations across Nepal. Available payment options are displayed during checkout. Online payments are processed through the applicable payment provider.'
    },
    {
      q: 'How long does delivery take inside Kathmandu and outside the valley?',
      a: 'Delivery times depend on your location and courier availability. Orders within Kathmandu Valley typically take 1–2 business days, while deliveries to other locations in Nepal typically take 2–4 business days. Remote areas may require additional time.'
    },
    {
      q: 'How are delivery charges calculated?',
      a: 'Delivery charges depend on your delivery district and the products in your order, where applicable. The applicable delivery fee is calculated at checkout and charged once per order rather than separately for each item, unless otherwise stated.'
    },
    {
      q: 'Can I track my order online?',
      a: 'Yes! Visit the Track Order page and enter your order number and registered mobile number to check your order status and available delivery updates.'
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
