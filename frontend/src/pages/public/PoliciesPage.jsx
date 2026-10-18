import React from 'react';
import { useLocation } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';

export const PoliciesPage = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Shipping Policy';
  let content = null;

  if (path.includes('shipping-policy')) {
    title = 'Shipping & Delivery Policy';
    content = (
      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>At OSOAA, we ensure prompt and secure delivery of your supplements across Nepal.</p>
        <h3 className="text-base font-bold text-black mt-4">1. Delivery Timelines</h3>
        <p>• Inside Kathmandu Valley: 1–2 business days.</p>
        <p>• Outside Kathmandu Valley (Major cities & districts across all 7 provinces): 2–4 business days.</p>
        <h3 className="text-base font-bold text-black mt-4">2. Shipping Charges</h3>
        <p>• Delivery charges are determined by the customer's selected district in Nepal and charged once per order regardless of item quantity.</p>
        <h3 className="text-base font-bold text-black mt-4">3. Packaging & Tamper-Proof Seals</h3>
        <p>All items are shipped in sturdy, tamper-evident packaging. Please inspect the outer seal before accepting Cash on Delivery parcels.</p>
      </div>
    );
  } else if (path.includes('return-policy')) {
    title = 'Return & Refund Policy';

    content = (
      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          At <strong>OSOAA Wellness &amp; Nutrition</strong>, we are committed to
          providing quality products and a reliable shopping experience. Please
          read our return, refund, and replacement policy carefully.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          RETURN POLICY
        </h3>

        <h4 className="font-bold text-black mt-4">
          Return Eligibility
        </h4>

        <p>
          For hygiene, safety, and product-quality reasons, products cannot be
          returned once their original seal has been broken, removed, opened,
          or tampered with.
        </p>

        <p>
          To be eligible for a return, the product must be unused and in its
          original condition, with the original seal, packaging, and labels
          intact.
        </p>

        <p>
          Customers must provide valid proof of purchase, such as an order
          confirmation or receipt, when requesting a return.
        </p>

        <h4 className="font-bold text-black mt-4">
          Broken or Tampered Seals
        </h4>

        <p>
          Products with broken, removed, or tampered original seals are not
          eligible for return due to a change of mind, personal preference,
          or a decision not to use the product.
        </p>

        <p>
          This restriction does not exclude remedies required by applicable law
          for products that are defective, unsafe, counterfeit, or incorrectly
          supplied.
        </p>

        <h4 className="font-bold text-black mt-4">
          Damaged, Defective, or Incorrect Products
        </h4>

        <p>
          If your order arrives damaged, defective, or different from the product
          you ordered, please contact OSOAA promptly at{" "}
          <a
            href="mailto:osoaanepal@gmail.com"
            className="text-orange-600 hover:underline"
          >
            osoaanepal@gmail.com
          </a>{" "}
          with your order number and clear photographs or videos showing the
          product and its packaging.
        </p>

        <p>
          After reviewing your request, we will inform you of the appropriate
          resolution, which may include a replacement, return, or refund,
          subject to verification and applicable law.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          REFUND POLICY
        </h3>

        <h4 className="font-bold text-black mt-4">
          Refund Approval
        </h4>

        <p>
          Once an authorized return is received, our team will inspect the
          product and verify its condition, original seal, packaging, and
          eligibility under this policy.
        </p>

        <p>
          We will notify you of the inspection outcome and whether your refund
          request has been approved.
        </p>

        <h4 className="font-bold text-black mt-4">
          Refund Processing
        </h4>

        <p>
          If your refund is approved, it will be initiated through the original
          payment method where possible, or through another mutually agreed
          payment method.
        </p>

        <p>
          The time required for the refund to appear in your account may vary
          depending on your bank or payment provider. For Cash on Delivery
          (COD) orders, our team will coordinate an appropriate refund method
          if a refund is approved.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          REPLACEMENT POLICY
        </h3>

        <p>
          If you receive a damaged, defective, or incorrect product, OSOAA will
          review your claim and, where appropriate, arrange a replacement or
          another suitable resolution.
        </p>

        <p>
          Please retain the original packaging and provide supporting evidence
          when submitting your claim. Do not return an item before receiving
          instructions from our team.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          RETURN SHIPPING
        </h3>

        <h4 className="font-bold text-black mt-4">
          Customer-Initiated Returns
        </h4>

        <p>
          For approved returns unrelated to an error by OSOAA, the customer
          may be responsible for applicable return shipping costs. Any charges
          will be communicated before the return is arranged, subject to
          applicable law.
        </p>

        <h4 className="font-bold text-black mt-4">
          Damaged, Defective, or Incorrect Products
        </h4>

        <p>
          Where a claim is verified and a return or replacement is approved
          because OSOAA supplied an incorrect product or the product arrived
          damaged or defective, OSOAA will bear the applicable return shipping
          costs.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          HOW TO REQUEST A RETURN OR REFUND
        </h3>

        <p>
          Contact our team at{" "}
          <a
            href="mailto:osoaanepal@gmail.com"
            className="text-orange-600 hover:underline"
          >
            osoaanepal@gmail.com
          </a>{" "}
          with your order number, the reason for your request, and supporting
          photographs or videos where applicable. Our team will review your
          request and explain the next steps.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          POLICY COMPLIANCE
        </h3>

        <p>
          OSOAA reserves the right to verify return and refund requests and
          reject fraudulent or unsupported claims. This policy will be applied
          in accordance with applicable consumer-protection laws in Nepal.
          Nothing in this policy is intended to limit consumer rights that
          cannot legally be excluded.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          CONTACT US
        </h3>

        <p>
          If you have questions about our return, refund, or replacement policy,
          please contact OSOAA at{" "}
          <a
            href="mailto:osoaanepal@gmail.com"
            className="text-orange-600 hover:underline"
          >
            osoaanepal@gmail.com
          </a>.
        </p>

        <p>
          <strong>OSOAA Wellness &amp; Nutrition</strong>
          <br />
          <strong>A Journey of Wellness</strong>
        </p>
      </div>
    )
  } else if (path.includes('privacy-policy')) {
    title = 'Privacy Policy';
    content = (
      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>Your privacy is paramount. This policy outlines how OSOAA collects and protects your customer data.</p>
        <h3 className="text-base font-bold text-black mt-4">1. Data Collection</h3>
        <p>We collect essential information required to fulfill deliveries, including name, delivery address, mobile phone number, and email address.</p>
        <h3 className="text-base font-bold text-black mt-4">2. Payment Data Security</h3>
        <p>We never store customer eSewa passwords or banking PINs. All online payments are securely processed through official gateway integrations.</p>
        <h3 className="text-base font-bold text-black mt-4">3. Third-Party Sharing</h3>
        <p>Customer contact details are shared strictly with our authorized delivery logistics partners to ensure delivery completion.</p>
      </div>
    );
  } else {
    title = 'Terms & Conditions';
    content = (
      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>Welcome to OSOAA Nepal. By using our website and purchasing our wellness products, you agree to the following terms.</p>
        <h3 className="text-base font-bold text-black mt-4">1. Pricing & NPR Currency</h3>
        <p>All prices listed on OSOAA are in Nepalese Rupees (NPR / Rs.) and are subject to change without prior notice.</p>
        <h3 className="text-base font-bold text-black mt-4">2. Product Usage & Consultation</h3>
        <p>Supplements should be consumed in accordance with stated label instructions. Consult a certified medical or fitness professional if you have pre-existing medical conditions.</p>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: title, item: path },
  ];

  const policyDescriptions = {
    'Shipping & Delivery Policy': 'Official shipping, logistics, and nationwide delivery timelines across Nepal for OSOAA fitness nutrition and supplements.',
    'Return & Refund Policy': 'Official return, replacement, and refund policies for authentic sealed supplements purchased on OSOAA Nepal.',
    'Privacy Policy': 'Our data protection, confidentiality, and customer privacy terms at OSOAA Nepal.',
    'Terms & Conditions': 'Official terms and conditions governing purchases and usage of the OSOAA Nepal e-commerce platform.',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 bg-white min-h-[75vh]">
      <SEO
        title={title}
        description={policyDescriptions[title] || `${title} for OSOAA Nepal.`}
        canonical={path}
        breadcrumbs={breadcrumbs}
      />
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-black">{title}</h1>
      </div>
      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm">
        {content}
      </div>
    </div>
  );
};
