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

      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          Your privacy is important to Nepal Protein. This Privacy Policy
          explains how we collect, use, store, and protect your personal
          information when you visit our website or purchase products from
          different brands through our store.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          1. Data Collection
        </h3>
        <p>
          We may collect information necessary to process orders and provide
          our services, including your name, delivery address, mobile phone
          number, email address, order details, and account information.
          We may also collect limited technical information about your
          interaction with our website to improve its performance and security.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          2. How We Use Your Information
        </h3>
        <p>
          Your information may be used to process orders, arrange deliveries,
          verify transactions, provide order updates, respond to customer
          inquiries, manage your account, prevent fraudulent activity, and
          improve our website and services.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          3. Payment Data Security
        </h3>
        <p>
          Online payments are processed through the applicable payment
          providers, such as eSewa, when available. Nepal Protein does not
          ask customers to share their payment passwords, banking PINs,
          or one-time passwords through customer support channels.
          Payment information handled by third-party providers is subject
          to their respective privacy and security practices.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          4. Third-Party Sharing
        </h3>
        <p>
          We may share necessary information with authorized delivery
          partners, payment providers, and service providers to fulfill
          orders, process payments, maintain website functionality, and
          protect against fraud. We do not authorize these parties to use
          your information for unrelated purposes beyond their permitted
          services and legal obligations.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          5. Data Storage &amp; Security
        </h3>
        <p>
          We take reasonable technical and organizational measures to
          protect personal information against unauthorized access,
          alteration, disclosure, or loss. However, no online system or
          method of electronic storage can be guaranteed to be completely
          secure.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          6. Cookies &amp; Website Technologies
        </h3>
        <p>
          Our website may use cookies or similar technologies to support
          essential website functions, maintain sessions, remember preferences,
          and understand website usage. You can manage available cookie
          preferences through your browser settings, although disabling
          certain cookies may affect website functionality.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          7. Data Retention
        </h3>
        <p>
          We retain personal information only for as long as reasonably
          necessary to fulfill orders, provide services, maintain business
          records, resolve disputes, protect website security, and meet
          applicable legal requirements.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          8. Your Privacy Rights
        </h3>
        <p>
          You may contact us to request access to, correction of, or
          information about your personal data, subject to applicable law
          and legitimate record-keeping requirements. We may need to verify
          your identity before processing certain requests.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          9. Children's Privacy
        </h3>
        <p>
          Our website is not intended to encourage children to make purchases
          without appropriate parental or guardian involvement. We do not
          knowingly collect personal information from children in violation
          of applicable law.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          10. Changes to This Privacy Policy
        </h3>
        <p>
          Nepal Protein may update this Privacy Policy to reflect changes
          in our services, data-handling practices, or legal requirements.
          Updates will be published on this page along with the revised
          policy text.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          11. Contact Us
        </h3>
        <p>
          If you have questions about this Privacy Policy or how your
          personal information is handled, please contact Nepal Protein
          through the contact details provided on our website.
        </p>
      </div>

    );
  } else {
    title = 'Terms & Conditions';
    content = (

      <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          Welcome to Nepal Protein. By accessing our website, browsing our
          products, or placing an order, you agree to the following Terms
          and Conditions. Please read them carefully before making a purchase.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          1. Pricing &amp; NPR Currency
        </h3>
        <p>
          All prices displayed on Nepal Protein are listed in Nepalese Rupees
          (NPR / Rs.), unless otherwise stated. Prices, product availability,
          and promotional offers may change without prior notice. The price
          applicable to your order will be the price displayed at checkout.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          2. Product Information &amp; Authenticity
        </h3>
        <p>
          Nepal Protein offers supplements, nutrition products, and fitness
          accessories from various brands. We aim to provide genuine products
          sourced from reliable suppliers. Customers should check product
          packaging, batch details, expiry dates, and factory seals where
          applicable upon delivery. Contact our support team if you receive
          a damaged, tampered with, or incorrect product.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          3. Product Usage &amp; Health Consultation
        </h3>
        <p>
          Supplements should be used according to the manufacturer's
          instructions and the directions provided on the product label.
          Consult a qualified healthcare professional before use if you
          have a medical condition, take medication, or have concerns about
          using a supplement. Supplements are not a substitute for a balanced
          diet or prescribed medical treatment.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          4. Orders &amp; Availability
        </h3>
        <p>
          All orders are subject to product availability and confirmation.
          Please provide accurate contact details and delivery information
          when placing an order. We may need to cancel or decline orders
          because of stock shortages, pricing errors, technical issues,
          or suspected fraudulent activity. Any payment collected for a
          cancelled order will be handled according to the applicable refund
          process and consumer protection requirements.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          5. Payments
        </h3>
        <p>
          Available payment methods may include eSewa and Cash on Delivery
          (COD), depending on your location and the options displayed at
          checkout. Online payments are subject to successful confirmation
          by the relevant payment provider. COD orders must be paid for
          upon delivery.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          6. Shipping &amp; Delivery
        </h3>
        <p>
          Delivery times and charges depend on your delivery district,
          product availability, and courier service conditions. Applicable
          delivery charges will be displayed during checkout or communicated
          before order confirmation. Delivery estimates may change due to
          weather, transportation disruptions, public holidays, or other
          circumstances beyond our reasonable control.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          7. Returns &amp; Damaged Products
        </h3>
        <p>
          Returns are subject to our applicable return policy. Supplements
          and other sealed products must remain unopened, unused, and
          untampered with to qualify for a return where permitted. Products
          with broken, removed, or tampered seals are generally not eligible
          for return, except where applicable law requires otherwise.
          If you receive a damaged, defective, or incorrect product, contact
          our support team with your order number and clear photos or videos
          of the issue. Applicable consumer rights remain unaffected.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          8. Website Use &amp; Intellectual Property
        </h3>
        <p>
          Website content, including text, graphics, logos, and design
          elements, belongs to Nepal Protein or the respective rights holders,
          unless otherwise stated. Unauthorized reproduction or commercial
          use is prohibited. Users must not misuse the website, attempt
          unauthorized access, or interfere with its operation.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          9. Privacy &amp; Personal Information
        </h3>
        <p>
          Customer information may be used to process orders, arrange
          deliveries, provide support, communicate order updates, and
          maintain website security. Personal information will be handled
          according to our Privacy Policy and applicable laws.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          10. Changes to These Terms
        </h3>
        <p>
          Nepal Protein may update these Terms and Conditions when business
          practices, website features, or legal requirements change. Updated
          terms will be published on this page.
        </p>

        <h3 className="text-base font-bold text-black mt-4">
          11. Contact Information
        </h3>
        <p>
          For questions about these Terms, products, orders, or returns,
          please contact our customer support team using the contact details
          provided on the Nepal Protein website.
        </p>
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
