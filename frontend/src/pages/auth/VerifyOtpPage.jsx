import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SEO } from '../../components/seo/SEO';

export const VerifyOtpPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get('email') || '';

  const { verifyOtp, resendOtp, isLoading } = useAuthStore();

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes expiry countdown

  const inputRefs = useRef([]);

  // Mask email for privacy
  const maskEmail = (email) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const maskedUser = user.length > 2 ? `${user.charAt(0)}****${user.charAt(user.length - 1)}` : user;
    return `${maskedUser}@${domain}`;
  };

  // Cooldown countdown
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 10-min expiry timer
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of full 6-digit code
      const pastedCode = value.replace(/\D/g, '').slice(0, 6);
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedCode.length; i++) {
        newDigits[i] = pastedCode[i];
      }
      setOtpDigits(newDigits);
      if (pastedCode.length === 6) {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const rawOtp = otpDigits.join('');
    if (rawOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    const res = await verifyOtp(emailParam, rawOtp);
    if (res.success) {
      setSuccessMessage('Email verified successfully! Welcome to OSOAA.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setErrorMessage(res.message || 'Invalid or expired code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMessage('');
    setSuccessMessage('');

    const res = await resendOtp(emailParam);
    if (res.success) {
      setSuccessMessage('A fresh verification code has been dispatched to your email.');
      setCooldown(60);
      setTimeLeft(600);
    } else {
      setErrorMessage(res.message || 'Failed to resend code.');
    }
  };

  const formatExpiryTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-white">
      <SEO title="Verify Account OTP" noindex={true} />
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-brand-navy">Verify Your Email</h1>
          <p className="text-xs text-slate-500">
            We sent a 6-digit verification code to:
          </p>
          <p className="text-xs font-bold text-brand-navy font-mono">
            {maskEmail(emailParam) || 'your registered email'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Input Boxes */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono shadow-sm"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Expires in: <strong className="text-orange-600 font-mono">{formatExpiryTime(timeLeft)}</strong></span>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-brand-navy hover:underline font-bold disabled:opacity-40 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-orange-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Activate Account</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
