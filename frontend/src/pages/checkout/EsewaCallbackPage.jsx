import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, RefreshCw, Truck } from 'lucide-react';
import api from '../../services/api';
import { SEO } from '../../components/seo/SEO';

export const EsewaCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const dataParam = searchParams.get('data');
  const failedParam = searchParams.get('failed');
  const queryOrderId = searchParams.get('orderId');
  const queryOrderNumber = searchParams.get('orderNumber');

  const [orderId, setOrderId] = useState(queryOrderId || '');
  const [orderNumber, setOrderNumber] = useState(queryOrderNumber || '');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed'
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (failedParam === 'true') {
      setStatus('failed');
      setErrorMessage('The eSewa transaction was cancelled or encountered a gateway error.');
      return;
    }

    if (!dataParam) {
      setStatus('failed');
      setErrorMessage('No payment callback data received from eSewa.');
      return;
    }

    let isMounted = true;

    const verifyTransaction = async () => {
      try {
        const response = await api.post('/payments/esewa/verify', { data: dataParam });
        if (!isMounted) return;

        if (response.data.success) {
          setStatus('success');
          const order = response.data.data;
          setOrderId(order.orderId);
          setOrderNumber(order.orderNumber);
          setTimeout(() => {
            navigate(`/order-success?orderNumber=${order.orderNumber}&orderId=${order.orderId}`);
          }, 2000);
        } else {
          setStatus('failed');
          setErrorMessage(response.data.message || 'Payment verification failed.');
          if (response.data.orderId) setOrderId(response.data.orderId);
          if (response.data.orderNumber) setOrderNumber(response.data.orderNumber);
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus('failed');
        const errData = err.response?.data;
        if (errData?.orderId) setOrderId(errData.orderId);
        if (errData?.orderNumber) setOrderNumber(errData.orderNumber);
        setErrorMessage(errData?.message || err.customMessage || 'Backend server-to-server payment verification failed.');
      }
    };

    verifyTransaction();

    return () => {
      isMounted = false;
    };
  }, [dataParam, failedParam, navigate]);

  const handleRetryPayment = async () => {
    if (!orderId) {
      navigate('/account/orders');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/payments/esewa/initiate', { orderId });
      const paymentPayload = res.data.data;

      if (paymentPayload) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentPayload.paymentUrl;

        for (const [key, value] of Object.entries(paymentPayload.formData)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) {
      alert(err.customMessage || 'Failed to re-initiate eSewa payment. Please try Cash on Delivery.');
      setActionLoading(false);
    }
  };

  const handleSwitchToCod = async () => {
    if (!orderId) {
      navigate('/account/orders');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/payments/switch-to-cod', { orderId });
      if (res.data.success) {
        navigate(`/order-success?orderNumber=${orderNumber || res.data.data.orderNumber}&orderId=${orderId}`);
      }
    } catch (err) {
      alert(err.customMessage || 'Failed to switch payment method.');
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center bg-white">
      <SEO title="Payment Verification" noindex={true} />
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-6">
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-black text-brand-navy">Verifying eSewa Payment</h2>
            <p className="text-xs text-slate-500">
              Please wait while our backend performs secure server-to-server signature verification...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-brand-navy">Payment Verified!</h2>
            <p className="text-xs text-slate-600">
              Your transaction is confirmed. Redirecting you to your order summary...
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-black text-brand-navy">Payment Incomplete</h2>
              {orderNumber && (
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                  Order #{orderNumber} (Pending)
                </p>
              )}
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {errorMessage}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Your order and reserved items are safely saved. You can switch to Cash on Delivery or re-attempt digital payment.
              </p>
            </div>

            <div className="space-y-3">
              {orderId && (
                <>
                  <button
                    type="button"
                    onClick={handleSwitchToCod}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-98"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Switch to Cash on Delivery (COD)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-98"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                    <span>Retry eSewa Payment</span>
                  </button>
                </>
              )}

              <Link
                to="/account/orders"
                className="block w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition"
              >
                View in My Orders &rarr;
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
