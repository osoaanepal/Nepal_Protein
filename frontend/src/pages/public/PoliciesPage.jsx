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
        <p>
          At Nepal Protein, we aim to deliver your supplements, nutrition
          products, and fitness accessories safely and promptly to
          serviceable locations across Nepal.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          1. Delivery Timelines
        </h3>
        <p>
          • Inside Kathmandu Valley: Estimated delivery within 1–2 business days.
        </p>
        <p>
          • Outside Kathmandu Valley: Estimated delivery within 2–4 business
          days for major cities and other serviceable locations across Nepal.
        </p>
        <p>
          Delivery times are estimates and may vary depending on your district,
          product availability, courier operations, weather, public holidays,
          and other unforeseen circumstances. Remote locations may require
          additional delivery time.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          2. Shipping Charges
        </h3>
        <p>
          Delivery charges depend on the customer's selected district and
          the applicable shipping rates configured by Nepal Protein.
          The applicable delivery fee will be displayed during checkout or
          communicated before order confirmation.
        </p>
        <p>
          Delivery charges are applied once per order rather than separately
          for each item, subject to the applicable shipping policy.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          3. Packaging &amp; Product Seals
        </h3>
        <p>
          We aim to package products securely to help protect them during
          transportation. Supplements and other sealed products should be
          delivered with their original manufacturer seals intact, where
          applicable. Please inspect the package and product seals upon
          delivery and report any visible damage, tampering, or incorrect
          items to our customer support team promptly.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          4. Cash on Delivery (COD)
        </h3>
        <p>
          Cash on Delivery is available in eligible locations where the
          option appears at checkout. Customers must pay the confirmed
          order total, including applicable delivery charges, when the
          order is delivered.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          5. Delivery Address &amp; Contact Details
        </h3>
        <p>
          Customers are responsible for providing an accurate delivery
          address, district, and reachable mobile number. Incorrect or
          incomplete information may cause delivery delays or failed
          delivery attempts.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          6. Delayed or Unsuccessful Deliveries
        </h3>
        <p>
          If your order is delayed or delivery cannot be completed, our
          team or delivery partner may contact you using the details
          provided at checkout. Additional delivery arrangements may be
          necessary depending on the circumstances and applicable policy.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          7. Damaged, Incorrect, or Missing Products
        </h3>
        <p>
          If you receive a damaged, incorrect, or incomplete order, contact
          our customer support team with your order number and clear
          photographs or videos of the issue. We will review your request
          and explain the available resolution under our return and
          replacement policy and applicable law.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          8. Contact Us
        </h3>
        <p>
          For questions about shipping, delivery charges, or an existing
          order, please contact Nepal Protein through the contact details
          provided on our website.
        </p>
      </div>

    );
  } else if (path.includes('return-policy')) {
    title = 'Return & Refund Policy';

    content = (

      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          At <strong>Nepal Protein</strong>, we are committed to
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
          you ordered, please contact Nepal Protein promptly at{" "}
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
          If you receive a damaged, defective, or incorrect product, Nepal Protein
          will review your claim and, where appropriate, arrange a replacement
          or another suitable resolution.
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
          For approved returns unrelated to an error by Nepal Protein, the customer
          may be responsible for applicable return shipping costs. Any charges
          will be communicated before the return is arranged, subject to
          applicable law.
        </p>

        <h4 className="font-bold text-black mt-4">
          Damaged, Defective, or Incorrect Products
        </h4>

        <p>
          Where a claim is verified and a return or replacement is approved
          because Nepal Protein supplied an incorrect product or the product
          arrived damaged or defective, Nepal Protein will bear the applicable
          return shipping costs.
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
          Nepal Protein reserves the right to verify return and refund requests
          and reject fraudulent or unsupported claims. This policy will be applied
          in accordance with applicable consumer-protection laws in Nepal.
          Nothing in this policy is intended to limit consumer rights that
          cannot legally be excluded.
        </p>

        <h3 className="text-base font-bold text-black mt-6">
          CONTACT US
        </h3>

        <p>
          If you have questions about our return, refund, or replacement policy,
          please contact Nepal Protein at{" "}
          <a
            href="mailto:osoaanepal@gmail.com"
            className="text-orange-600 hover:underline"
          >
            osoaanepal@gmail.com
          </a>.
        </p>

        <p>
          <strong>Nepal Protein</strong>
          <br />
          <strong>A Journey of Wellness</strong>
        </p>
      </div>

    )
  } else if (path.includes('privacy-policy')) {
    title = 'Privacy Policy';
    content = (
      <div className="space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          Your privacy is important to <strong>Nepal Protein</strong>. This Privacy Policy
          explains how we collect, use, store, and protect your personal information when
          you create an account, browse our store, or purchase supplements and nutrition products.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          1. Account &amp; Personal Data We Collect
        </h3>
        <p>
          When you register an account or interact with Nepal Protein, we collect information
          strictly necessary to provide our services:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Full Name:</strong> To identify your account and address your orders.</li>
          <li><strong>Email Address:</strong> For account authentication, password recovery, order receipts, and one-time password (OTP) verification.</li>
          <li><strong>Nepalese Mobile Number:</strong> Required 10-digit mobile number (e.g., 98XXXXXXXX, 97XXXXXXXX, 96XXXXXXXX) for courier coordination, delivery updates, and verification.</li>
          <li><strong>Account Password:</strong> Cryptographically hashed using industry-standard hashing algorithms (bcrypt). Passwords are never stored or accessible in plain text.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          2. Delivery &amp; Order Information
        </h3>
        <p>
          To process and deliver your purchases, we collect:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Shipping Address:</strong> Specific street address, city, and selected administrative district across Nepal.</li>
          <li><strong>Order Details:</strong> Products ordered, flavors, sizes, quantities, order status, order history, and tracking timeline.</li>
          <li><strong>Recipient Contact:</strong> Contact number and recipient name for delivery dispatch.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          3. Payment Information &amp; Data Security
        </h3>
        <p>
          Nepal Protein supports <strong>Cash on Delivery (COD)</strong> and digital payments via <strong>eSewa</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Digital Payments (eSewa):</strong> Online payments are processed directly through eSewa's secure payment gateway. Nepal Protein <em>never</em> requests, collects, or stores your banking passwords, eSewa MPIN, credit/debit card numbers, or one-time payment passcodes.</li>
          <li><strong>Cash on Delivery (COD):</strong> No financial payment information is collected online; payment is handed directly in cash to the delivery courier upon receipt of the package.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          4. How We Use Your Information
        </h3>
        <p>
          We use your information exclusively for legitimate e-commerce operations:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Processing, confirming, and fulfilling your orders.</li>
          <li>Communicating order status updates and shipping notifications.</li>
          <li>Providing responsive customer support for inquiries, order tracking, and returns.</li>
          <li>Preventing fraudulent orders and maintaining platform security.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          5. Cookies, Local Storage &amp; Session Management
        </h3>
        <p>
          Our application utilizes browser <strong>Local Storage</strong> and essential session
          tokens (JSON Web Tokens) strictly to maintain your logged-in session, preserve your
          shopping cart items, and keep your wishlist intact across visits. We do not use third-party
          surveillance trackers or sell your browsing behaviors to advertising networks.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          6. Third-Party Service Providers &amp; Sharing
        </h3>
        <p>
          We share necessary data solely with trusted third-party operational partners required to complete your service:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Logistics &amp; Courier Partners:</strong> Name, delivery address, and phone number are shared to deliver packages within Kathmandu Valley and nationwide districts across Nepal.</li>
          <li><strong>Payment Processors (eSewa):</strong> Order reference and payable amount for transaction verification.</li>
          <li><strong>Communication Providers:</strong> Secure automated email services for account verification OTPs and order invoices.</li>
        </ul>
        <p>
          We do not sell, rent, or trade your personal information to third parties for independent marketing.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          7. Data Storage, Retention &amp; Security
        </h3>
        <p>
          We implement technical and organizational safeguards to protect your personal data from unauthorized access, alteration, or disclosure. Personal and order data is retained only for as long as necessary to fulfill orders, maintain statutory tax/financial records, resolve disputes, and comply with applicable laws of Nepal.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          8. Your Rights &amp; Account Control
        </h3>
        <p>
          You have full access to view and update your profile details and saved addresses directly in your account dashboard. You may request review or correction of your personal data by contacting our support team at <a href="mailto:osoaanepal@gmail.com" className="text-orange-600 font-semibold hover:underline">osoaanepal@gmail.com</a>.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          9. Children's Privacy
        </h3>
        <p>
          Our platform is intended for adult consumers and fitness enthusiasts. We do not knowingly collect personal information from individuals under the age of 16 without parental or legal guardian guidance.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          10. Changes to This Privacy Policy
        </h3>
        <p>
          Nepal Protein reserves the right to update this policy to reflect platform updates, technical adjustments, or legislative changes in Nepal. All updates are published directly on this page with immediate effect.
        </p>
      </div>
    );
  } else {
    title = 'Terms & Conditions';
    content = (
      <div className="space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          Welcome to <strong>Nepal Protein</strong>. By browsing our website, creating an account,
          or placing an order, you agree to comply with and be bound by the following Terms and Conditions.
          Please read them carefully before making a purchase.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          1. Currency &amp; Pricing
        </h3>
        <p>
          All product prices on Nepal Protein are stated in <strong>Nepalese Rupees (NPR / Rs.)</strong>.
          Prices, promotions, and stock availability are subject to change without prior notice. The price
          payable is the total confirmed on the checkout screen at the time your order is submitted.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          2. Product Authenticity &amp; Health Disclaimer
        </h3>
        <p>
          Nepal Protein supplies authentic nutritional supplements, whey proteins, vitamins, and fitness
          accessories sourced from authorized distributors.
        </p>
        <p className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl">
          <strong>Health Notice:</strong> Dietary and nutritional supplements are intended to support your fitness
          and dietary goals and are not medicinal substitutes for professional medical diagnosis, advice, or treatment.
          Always consult a certified healthcare professional before beginning any intensive supplement regimen,
          especially if you have pre-existing medical conditions, are pregnant, or are taking medication.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          3. Account Registration &amp; Security
        </h3>
        <p>
          When creating an account, you agree to provide truthful and complete information, including a valid
          10-digit Nepalese mobile number. You are responsible for safeguarding your login credentials. Notify
          us immediately of any suspected unauthorized use of your account.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          4. Ordering &amp; Payment Terms
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Payment Methods:</strong> We accept Cash on Delivery (COD) and eSewa digital wallet payments.</li>
          <li><strong>eSewa Transactions:</strong> Digital orders are confirmed upon successful online transaction verification through the payment gateway.</li>
          <li><strong>Cash on Delivery:</strong> COD customers are obligated to provide exact payment in cash to the delivery partner upon physical delivery.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          5. Shipping &amp; Delivery Across Nepal
        </h3>
        <p>
          Delivery timelines are estimated as 1–2 business days inside Kathmandu Valley and 2–4 business days
          for major cities and accessible districts across Nepal. Delivery fees depend on the recipient district
          and are calculated transparently during checkout. Unforeseen courier delays due to road blockades,
          weather extremes, or public holidays may occasionally occur.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          6. Order Cancellation Policy
        </h3>
        <p>
          Nepal Protein provides self-service order cancellation directly from your customer account dashboard:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Eligible Statuses:</strong> You may cancel your order at any time while the order status remains <code>PENDING</code> or <code>CONFIRMED</code>. Reserved inventory is automatically returned to stock.</li>
          <li><strong>Ineligible Statuses:</strong> Once an order transitions to <code>PROCESSING</code>, <code>SHIPPED</code>, or <code>DELIVERED</code>, self-service cancellation is disabled because the parcel has been packed or dispatched for transit. For assistance after dispatch, you must contact customer support.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          7. Returns, Replacements &amp; Refunds
        </h3>
        <p>
          Due to strict hygiene, food safety, and quality standards, <strong>nutritional supplements and sealed products cannot be returned once their manufacturer seal has been broken, opened, or tampered with</strong>.
        </p>
        <p>
          If your shipment arrives damaged, defective, leaking, or with incorrect items, you must contact our customer support team promptly with your order number and clear photographic/video proof. Verified claims are eligible for a free replacement or a full refund.
        </p>

        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-orange-900">
            Business Details Subject to Business Owner Confirmation
          </h4>
          <p className="text-xs text-orange-900/90 leading-relaxed">
            The following commercial and administrative terms are subject to final confirmation by Nepal Protein's business management:
          </p>
          <ul className="list-disc pl-5 text-xs text-orange-900/90 space-y-1">
            <li><strong>Exact Return Window:</strong> Standard return notification period (e.g., within 7 calendar days of delivery for eligible unopened goods).</li>
            <li><strong>Corporate Registration:</strong> Official registered company name, PAN (Permanent Account Number), and VAT registration numbers.</li>
            <li><strong>Designated Jurisdiction:</strong> Specific judicial district court for dispute resolution (e.g., Kathmandu District Court, Nepal).</li>
            <li><strong>Hardware/Accessory Warranty:</strong> Specific brand warranty duration for gym accessories, shakers, and non-consumable gear.</li>
          </ul>
        </div>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          8. Intellectual Property &amp; Website Usage
        </h3>
        <p>
          All trademarks, logos, brand names, product photographs, and text published on Nepal Protein belong
          to Nepal Protein or the respective brand manufacturers. Commercial exploitation or unauthorized scraping
          is strictly prohibited.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          9. Governing Law
        </h3>
        <p>
          These Terms and Conditions and any separate agreements shall be governed by and construed in accordance
          with the prevailing laws of Nepal.
        </p>

        <h3 className="text-base font-bold text-slate-900 mt-5">
          10. Contact Information
        </h3>
        <p>
          For questions regarding these Terms or orders, please contact us at{' '}
          <a href="mailto:osoaanepal@gmail.com" className="text-orange-600 font-semibold hover:underline">
            osoaanepal@gmail.com
          </a>.
        </p>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: title, item: path },
  ];

  const policyDescriptions = {
    'Shipping & Delivery Policy': 'Official shipping, logistics, and nationwide delivery timelines across Nepal for Nepal Protein fitness nutrition and supplements.',
    'Return & Refund Policy': 'Official return, replacement, and refund policies for authentic sealed supplements purchased on Nepal Protein.',
    'Privacy Policy': 'Our data protection, confidentiality, and customer privacy terms at Nepal Protein.',
    'Terms & Conditions': 'Official terms and conditions governing purchases and usage of the Nepal Protein e-commerce platform.',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 bg-white min-h-[75vh]">
      <SEO
        title={title}
        description={policyDescriptions[title] || `${title} for Nepal Protein.`}
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
