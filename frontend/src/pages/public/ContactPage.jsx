import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import api from '../../services/api';
import { SEO } from '../../components/seo/SEO';
import { buildStoreSchema } from '../../utils/seoSchemas';

export const ContactPage = () => {
  const { settings } = useSettingsStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successResponse, setSuccessResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const contactData = settings?.contact || {};
  const socialData = settings?.socialLinks || {};

  const address = contactData.address?.trim() || '';
  const phone = contactData.phone?.trim() || '';
  const secondaryPhone = contactData.secondaryPhone?.trim() || '';
  const email = contactData.email?.trim() || '';
  const mapsUrl = contactData.mapsUrl?.trim() || '';

  const hasAnyContactInfo = Boolean(address || phone || secondaryPhone || email);

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Please enter your full name.';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!form.subject.trim()) {
      errors.subject = 'Please provide a subject.';
    } else if (form.subject.trim().length < 2) {
      errors.subject = 'Subject must be at least 2 characters.';
    }

    if (!form.message.trim()) {
      errors.message = 'Please enter your message.';
    } else if (form.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters long.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim()
      };

      const response = await api.post('/contact', payload);

      if (response.data && response.data.success) {
        setSuccessResponse({
          message: response.data.message || 'Thank you! Your message has been received.',
          name: payload.name,
          email: payload.email
        });
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setErrorMessage(response.data?.message || 'Unable to submit your message. Please try again.');
      }
    } catch (err) {
      const serverMsg = err.customMessage || err.response?.data?.message || 'A network or server error occurred. Please try again later.';
      setErrorMessage(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessResponse(null);
    setErrorMessage('');
    setValidationErrors({});
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Contact Us', item: '/contact' },
  ];

  return (
    <div className="bg-white min-h-[80vh]">
      <SEO
        title="Contact Us | Supplement Inquiries & Support Nepal"
        description="Contact Nepal Protein. Get in touch with our team for authentic fitness supplements inquiries, nationwide courier tracking, and support in Nepal."
        canonical="/contact"
        breadcrumbs={breadcrumbs}
        jsonLd={buildStoreSchema()}
      />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Customer Support</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
            Contact Nepal Protein
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have questions regarding supplement authenticity, DFTQC quality compliance reports, product dosage recommendations, or order delivery across Nepal? Reach out to our nutrition specialists.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Verified Business Information & Trust Badges */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-black flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  <span>Get In Touch</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Direct communication channels with our Nepal support team.
                </p>
              </div>

              {hasAnyContactInfo ? (
                <div className="space-y-3.5">
                  {/* Address */}
                  {address && (
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-black block">Official Address</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{address}</p>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline pt-1"
                          >
                            <span>View on Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {(phone || secondaryPhone) && (
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-black block">Phone & WhatsApp</span>
                        <div className="text-xs text-slate-700 font-medium space-x-2">
                          {phone && (
                            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-orange-600 transition">
                              {phone}
                            </a>
                          )}
                          {phone && secondaryPhone && <span className="text-slate-300">|</span>}
                          {secondaryPhone && (
                            <a href={`tel:${secondaryPhone.replace(/\s+/g, '')}`} className="hover:text-orange-600 transition">
                              {secondaryPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {email && (
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-black block">Support Email</span>
                        <a
                          href={`mailto:${email}`}
                          className="text-xs text-orange-600 hover:text-orange-700 font-semibold break-all hover:underline"
                        >
                          {email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                  Our customer service team is actively handling inquiries through the contact form.
                </div>
              )}

              {/* Social Channels if configured */}
              {(socialData.facebook || socialData.instagram || socialData.youtube) && (
                <div className="pt-4 border-t border-slate-200">
                  <span className="text-xs font-bold text-black block mb-2.5">Official Social Channels</span>
                  <div className="flex items-center gap-2">
                    {socialData.facebook && (
                      <a
                        href={socialData.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition shadow-sm"
                        aria-label="Visit OSOAA Facebook page"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                    {socialData.instagram && (
                      <a
                        href={socialData.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition shadow-sm"
                        aria-label="Visit OSOAA Instagram profile"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {socialData.youtube && (
                      <a
                        href={socialData.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition shadow-sm"
                        aria-label="Visit OSOAA YouTube channel"
                      >
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Business Assurance Note */}
              <div className="p-4 rounded-2xl bg-[#E5E7EB] text-black border border-gray-300 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Quality & Authenticity Guaranteed</span>
                </div>
                <p className="text-[11px] text-gray-800 leading-relaxed">
                  Every batch of OSOAA supplements follows strict quality testing guidelines aligned with DFTQC food safety standards for verified purity and authentic nutrition.
                </p>
              </div>

            </div>
          </aside>

          {/* Right Column: Contact Us Form */}
          <section className="lg:col-span-7" aria-labelledby="contact-form-heading">
            <div className="p-6 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-6">

              <div className="space-y-1">
                <h2 id="contact-form-heading" className="text-xl font-black text-black">
                  Send Us a Message
                </h2>
                <p className="text-xs text-slate-500">
                  Fill out the form below and our customer support team will get back to you promptly.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block font-bold">Submission Failed</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Success View */}
              {successResponse ? (
                <div
                  role="status"
                  className="p-8 sm:p-10 text-center space-y-5 bg-white rounded-2xl border border-emerald-200 shadow-sm animate-in fade-in zoom-in-95"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-black">
                      Message Received Successfully!
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      {successResponse.message}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1 max-w-md mx-auto">
                    <p><strong>From:</strong> {successResponse.name}</p>
                    <p><strong>Confirmation sent to:</strong> {successResponse.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              ) : (
                /* Interactive Form */
                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="contact-name" className="text-xs font-bold text-slate-700 block mb-1.5">
                        Your Full Name <span className="text-orange-600" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        aria-required="true"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-3.5 py-3 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-sm transition ${validationErrors.name ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-orange-500'
                          }`}
                      />
                      {validationErrors.name && (
                        <p className="mt-1 text-[11px] text-rose-600 font-medium">{validationErrors.name}</p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label htmlFor="contact-email" className="text-xs font-bold text-slate-700 block mb-1.5">
                        Email Address <span className="text-orange-600" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        aria-required="true"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3.5 py-3 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-sm transition ${validationErrors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-orange-500'
                          }`}
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-[11px] text-rose-600 font-medium">{validationErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone & Subject Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mobile Number (Optional) */}
                    <div>
                      <label htmlFor="contact-phone" className="text-xs font-bold text-slate-700 block mb-1.5">
                        Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder="+977-98XXXXXXXX"
                        value={form.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="contact-subject" className="text-xs font-bold text-slate-700 block mb-1.5">
                        Subject / Topic <span className="text-orange-600" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        required
                        aria-required="true"
                        placeholder="e.g. Whey Protein Dosage or Order Inquiry"
                        value={form.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className={`w-full px-3.5 py-3 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-sm transition ${validationErrors.subject ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-orange-500'
                          }`}
                      />
                      {validationErrors.subject && (
                        <p className="mt-1 text-[11px] text-rose-600 font-medium">{validationErrors.subject}</p>
                      )}
                    </div>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label htmlFor="contact-message" className="text-xs font-bold text-slate-700 block mb-1.5">
                      Your Message <span className="text-orange-600" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      aria-required="true"
                      rows={5}
                      placeholder="Please write your questions, dietary requirements, or specific order details here..."
                      value={form.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={`w-full px-3.5 py-3 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-sm transition ${validationErrors.message ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-orange-500'
                        }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {validationErrors.message ? (
                        <p className="text-[11px] text-rose-600 font-medium">{validationErrors.message}</p>
                      ) : (
                        <span className="text-[11px] text-slate-400">Minimum 10 characters</span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {form.message.length}/3000
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs rounded-xl shadow-orange-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Message</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    🔒 Your contact details are securely protected and strictly used for inquiry resolution.
                  </p>

                </form>
              )}

            </div>
          </section>

        </div>
      </main>
    </div>
  );
};
