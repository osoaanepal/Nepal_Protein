import React, { useEffect, useState } from 'react';
import {
  Save,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  AlertCircle,
  Search,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS_BY_PROVINCE,
  ALL_NEPAL_DISTRICTS,
  DISTRICT_TO_PROVINCE_MAP
} from '../../constants/nepalAddresses';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form States
  const [businessName, setBusinessName] = useState('OSOAA');
  const [category, setCategory] = useState('Welliness & Nutrition');
  const [tagline, setTagline] = useState('A Journey of Wellness');
  const [phone, setPhone] = useState('+977-9801234567');
  const [secondaryPhone, setSecondaryPhone] = useState('+977-01-4432100');
  const [email, setEmail] = useState('info@osoaa.com.np');
  const [address, setAddress] = useState('Birgunj 10 Ashokbakita, Parsa');

  // District Delivery Charges State
  const [districtCharges, setDistrictCharges] = useState({});
  const [districtSearch, setDistrictSearch] = useState('');
  const [selectedProvinceTab, setSelectedProvinceTab] = useState('ALL');
  const [bulkFeeInput, setBulkFeeInput] = useState('');
  const [savingCharges, setSavingCharges] = useState(false);
  const [chargesSuccessMsg, setChargesSuccessMsg] = useState('');
  const [chargesErrorMsg, setChargesErrorMsg] = useState('');

  // Payments
  const [codEnabled, setCodEnabled] = useState(true);
  const [esewaEnabled, setEsewaEnabled] = useState(true);

  // DFTQC Quality & Regulatory Standards
  const [dftqcEnabled, setDftqcEnabled] = useState(true);
  const [certName, setCertName] = useState('DFTQC Quality Standards & Compliance');
  const [labName, setLabName] = useState('DFTQC Quality Guidelines Aligned');
  const [certNumber, setCertNumber] = useState('');
  const [accreditationScope, setAccreditationScope] = useState('Nutritional Analysis, Purity Verification & Heavy Metals Testing');
  const [dftqcDescription, setDftqcDescription] = useState('OSOAA products follow strict quality testing guidelines aligned with Nepal\'s Department of Food Technology and Quality Control (DFTQC) standards for authentic protein concentration, absence of heavy metals, and pure nutrition.');
  const [trustBadgesText, setTrustBadgesText] = useState(
    'DFTQC Food Quality Standards Aligned\n100% Genuine & Authentic Batches\nZero Banned Substances\nHeavy Metals Tested & Cleared\nFast Nationwide Delivery Across Nepal'
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        const s = res.data.data;
        if (s) {
          setSettings(s);
          setBusinessName(s.businessName || 'OSOAA');
          setCategory(s.category || 'Welliness & Nutrition');
          setTagline(s.tagline || 'A Journey of Wellness');
          setPhone(s.contact?.phone || '+977-9801234567');
          setSecondaryPhone(s.contact?.secondaryPhone || '+977-01-4432100');
          setEmail(s.contact?.email || 'info@osoaa.com.np');
          setAddress(s.contact?.address || 'Durbar Marg, Kathmandu, Nepal');

          const rawCharges = s.deliverySettings?.districtCharges || {};
          setDistrictCharges(typeof rawCharges === 'object' ? rawCharges : {});

          setCodEnabled(s.paymentSettings?.codEnabled ?? true);
          setEsewaEnabled(s.paymentSettings?.esewaEnabled ?? true);

          const cert = s.dftqcCertification || s.nablCertification;
          if (cert) {
            setDftqcEnabled(cert.enabled ?? true);
            setCertName(cert.certificationName || '');
            setLabName(cert.laboratoryName || '');
            setCertNumber(cert.certificateNumber || '');
            setAccreditationScope(cert.accreditationScope || '');
            setDftqcDescription(cert.shortDescription || '');
            setTrustBadgesText(cert.trustBadges?.join('\n') || '');
          }
        }
      } catch (err) {
        console.error('Failed to load business settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleDistrictFeeChange = (district, val) => {
    setDistrictCharges((prev) => ({
      ...prev,
      [district]: val === '' ? '' : Math.max(0, Number(val)),
    }));
  };

  const handleBulkApply = (scope) => {
    if (bulkFeeInput === '' || isNaN(Number(bulkFeeInput))) return;
    const feeVal = Math.max(0, Number(bulkFeeInput));

    setDistrictCharges((prev) => {
      const updated = { ...prev };
      if (scope === 'ALL') {
        ALL_NEPAL_DISTRICTS.forEach((d) => {
          updated[d] = feeVal;
        });
      } else if (scope === 'EMPTY') {
        ALL_NEPAL_DISTRICTS.forEach((d) => {
          if (updated[d] === undefined || updated[d] === null || updated[d] === '') {
            updated[d] = feeVal;
          }
        });
      } else if (scope === 'FILTERED') {
        const targetDistricts = selectedProvinceTab === 'ALL'
          ? ALL_NEPAL_DISTRICTS
          : (NEPAL_DISTRICTS_BY_PROVINCE[selectedProvinceTab] || []);
        targetDistricts.forEach((d) => {
          updated[d] = feeVal;
        });
      }
      return updated;
    });

    setChargesSuccessMsg(`Applied Rs ${feeVal} fee to selected districts.`);
    setTimeout(() => setChargesSuccessMsg(''), 4000);
  };

  const handleSaveDistrictChargesDirect = async () => {
    setSavingCharges(true);
    setChargesSuccessMsg('');
    setChargesErrorMsg('');

    try {
      const res = await api.put('/settings/delivery-charges', {
        districtCharges,
      });
      setChargesSuccessMsg('District delivery charges saved successfully to database!');
      if (res.data?.data) {
        setDistrictCharges(res.data.data);
      }
      setTimeout(() => setChargesSuccessMsg(''), 4000);
    } catch (err) {
      setChargesErrorMsg(err.customMessage || 'Failed to save delivery charges');
    } finally {
      setSavingCharges(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        businessName,
        category,
        tagline,
        contact: {
          phone,
          secondaryPhone,
          email,
          address,
        },
        deliverySettings: {
          districtCharges,
        },
        paymentSettings: {
          codEnabled,
          esewaEnabled,
        },
        dftqcCertification: {
          enabled: dftqcEnabled,
          certificationName: certName,
          laboratoryName: labName,
          certificateNumber: certNumber,
          accreditationScope,
          shortDescription: dftqcDescription,
          trustBadges: trustBadgesText.split('\n').map((b) => b.trim()).filter(Boolean),
        },
        nablCertification: {
          enabled: dftqcEnabled,
          certificationName: certName,
          laboratoryName: labName,
          certificateNumber: certNumber,
          accreditationScope,
          shortDescription: dftqcDescription,
          trustBadges: trustBadgesText.split('\n').map((b) => b.trim()).filter(Boolean),
        },
      };

      await api.put('/settings', payload);
      setMessage('Business settings & delivery configuration updated successfully!');
    } catch (err) {
      setError(err.customMessage || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const displayedDistricts = ALL_NEPAL_DISTRICTS.filter((dist) => {
    const matchesProvince = selectedProvinceTab === 'ALL' || DISTRICT_TO_PROVINCE_MAP[dist] === selectedProvinceTab;
    const matchesSearch = !districtSearch.trim() || dist.toLowerCase().includes(districtSearch.trim().toLowerCase());
    return matchesProvince && matchesSearch;
  });

  const configuredCount = ALL_NEPAL_DISTRICTS.filter((d) => {
    const fee = districtCharges[d];
    return fee !== undefined && fee !== null && fee !== '' && !isNaN(Number(fee)) && Number(fee) >= 0;
  }).length;

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-white">Business & DFTQC Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure business metadata, Nepal district-wise delivery charges (charged once per order), payment options, and DFTQC food quality & regulatory compliance details
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* 1. General Business Branding */}
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building2 className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              1. Business Branding & Location (Nepal)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-white block mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Business Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-bold text-white block mb-1">Tagline / Slogan</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-white block mb-1">Primary Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Secondary Phone</label>
              <input
                type="text"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-bold text-white block mb-1">Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-white block mb-1">Store Address in Nepal</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. District Delivery Charges (Nepal - 77 Districts) */}
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  2. Nepal District Delivery Charges (Once Per Order)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set, edit, and save the delivery fee for each of Nepal's 77 districts. Charged once per order regardless of cart items or quantities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${configuredCount === 77
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                {configuredCount} / 77 Configured
              </span>
              <button
                type="button"
                onClick={handleSaveDistrictChargesDirect}
                disabled={savingCharges}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingCharges ? 'Saving...' : 'Save Charges'}</span>
              </button>
            </div>
          </div>

          {chargesSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{chargesSuccessMsg}</span>
            </div>
          )}

          {chargesErrorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{chargesErrorMsg}</span>
            </div>
          )}

          {/* Quick Bulk Setting Toolbar */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Quick Bulk Charge Tool</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-36">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">Rs.</span>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 100"
                  value={bulkFeeInput}
                  onChange={(e) => setBulkFeeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleBulkApply('FILTERED')}
                disabled={bulkFeeInput === ''}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition disabled:opacity-40"
              >
                Apply to Current Tab ({selectedProvinceTab})
              </button>
              <button
                type="button"
                onClick={() => handleBulkApply('EMPTY')}
                disabled={bulkFeeInput === ''}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition disabled:opacity-40"
              >
                Apply to All Unconfigured
              </button>
              <button
                type="button"
                onClick={() => handleBulkApply('ALL')}
                disabled={bulkFeeInput === ''}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold rounded-xl border border-slate-700 transition disabled:opacity-40"
              >
                Apply to All 77 Districts
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search district (e.g. Jhapa, Kathmandu, Morang, Kaski)..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Province Tabs */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => setSelectedProvinceTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedProvinceTab === 'ALL'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
              >
                All (77)
              </button>
              {NEPAL_PROVINCES.map((prov) => {
                const count = (NEPAL_DISTRICTS_BY_PROVINCE[prov] || []).length;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setSelectedProvinceTab(prov)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedProvinceTab === prov
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    {prov} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* District Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {displayedDistricts.map((dist) => {
              const prov = DISTRICT_TO_PROVINCE_MAP[dist] || 'Nepal';
              const rawVal = districtCharges[dist];
              const isConfigured = rawVal !== undefined && rawVal !== null && rawVal !== '' && !isNaN(Number(rawVal)) && Number(rawVal) >= 0;

              return (
                <div
                  key={dist}
                  className={`p-3 rounded-2xl border transition ${isConfigured
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-amber-950/20 border-amber-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-white block">{dist}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{prov}</span>
                    </div>
                    {isConfigured ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Rs {rawVal}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        No Fee
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 100"
                      value={rawVal ?? ''}
                      onChange={(e) => handleDistrictFeeChange(dist, e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {displayedDistricts.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No districts match your search filter "{districtSearch}".
            </div>
          )}
        </div>

        {/* 3. Payment Gateways */}
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CreditCard className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              3. Payment Gateways (Nepal)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="text-xs font-bold text-white block">Cash on Delivery (COD) Enabled</span>
                <span className="text-[11px] text-slate-400">Accept payment upon physical delivery across Nepal</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={esewaEnabled}
                onChange={(e) => setEsewaEnabled(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-emerald-400 block">eSewa Payment Gateway Enabled</span>
                <span className="text-[11px] text-slate-400">EPAY v2 server-to-server signature verification</span>
              </div>
            </label>
          </div>
        </div>

        {/* 4. DFTQC Quality Standards Configuration */}
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
              <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                4. DFTQC Food Quality Standards & Compliance
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
              <input
                type="checkbox"
                checked={dftqcEnabled}
                onChange={(e) => setDftqcEnabled(e.target.checked)}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span>Section Visible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-white block mb-1">Quality Standard / Policy Title</label>
              <input
                type="text"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="e.g. DFTQC Quality Standards & Compliance"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Regulatory / Testing Standard Name</label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="e.g. DFTQC Quality Guidelines Aligned"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Document Reference / Standard # (Optional)</label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="e.g. Standard or Record Reference (optional)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Quality & Testing Scope</label>
              <input
                type="text"
                value={accreditationScope}
                onChange={(e) => setAccreditationScope(e.target.value)}
                placeholder="e.g. Nutritional Analysis, Purity Verification & Heavy Metals Testing"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-white block mb-1">Factual Quality & Testing Standards Description</label>
              <textarea
                rows={3}
                value={dftqcDescription}
                onChange={(e) => setDftqcDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-white block mb-1">Trust Badges (One per line)</label>
              <textarea
                rows={4}
                value={trustBadgesText}
                onChange={(e) => setTrustBadgesText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Updating Settings...' : 'Save All Business Settings'}</span>
        </button>
      </form>
    </div>
  );
};
