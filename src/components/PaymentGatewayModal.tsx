import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatCurrencyAmount } from '../data/gamification';
import type { PurchaseReceipt } from '../types/piryas';

export type PaidPlanChoice = 'hints_20' | 'ad_free' | 'monthly' | 'annual' | 'lifetime';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  uid: string;
  currentPlan: string;
  initialPlanId?: PaidPlanChoice;
  onClose: () => void;
  onSuccessPurchase: (receipt: PurchaseReceipt) => Promise<void>;
}

function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectCardBrand(digits: string): string {
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Card';
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  uid,
  currentPlan,
  initialPlanId = 'ad_free',
  onClose,
  onSuccessPurchase,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<PaidPlanChoice>(initialPlanId);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'wallet'>('upi');
  const [promoCode, setPromoCode] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [walletProvider, setWalletProvider] = useState<'Apple Pay' | 'Google Pay' | 'PayPal'>('Google Pay');

  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<PurchaseReceipt | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId(initialPlanId);
      setErrorMsg(null);
    }
  }, [isOpen, initialPlanId]);

  const selectedPlan = useMemo(
    () => SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0],
    [selectedPlanId]
  );

  const promoApplied = promoCode.trim().toUpperCase() === 'PIRYAS20';
  const discountCents = promoApplied ? Math.round(selectedPlan.cents * 0.2) : 0;
  const finalCents = selectedPlan.cents - discountCents;

  if (!isOpen) return null;

  const fillSandboxCard = () => {
    setCardHolder('Irfan Pathan');
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/29');
    setCardCvc('424');
    setErrorMsg(null);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setProcessing(true);

    try {
      const resp = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          planId: selectedPlanId,
          paymentMethod,
          promoCode: promoCode.trim(),
          cardHolder,
          cardNumber,
          cardExpiry,
          cardCvc,
          upiId,
          walletProvider,
        }),
      });

      const data = (await resp.json()) as {
        error?: string;
        status?: string;
        checkoutUrl?: string;
        transactionId?: string;
        planId?: PaidPlanChoice;
        amountCents?: number;
        currency?: 'INR' | 'USD';
        paymentMethod?: 'card' | 'upi' | 'wallet';
        cardLast4?: string | null;
        receiptTimestamp?: string;
      };

      if (!resp.ok) {
        setErrorMsg(data.error || 'Payment declined. Verify details and try again.');
        return;
      }

      if (data.status === 'redirect' && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      const receipt: PurchaseReceipt = {
        uid,
        transactionId: data.transactionId || `piryas_${Date.now()}`,
        planId: data.planId || selectedPlanId,
        amountCents: data.amountCents ?? finalCents,
        currency: data.currency || 'INR',
        paymentMethod: data.paymentMethod || paymentMethod,
        cardLast4: data.cardLast4 || undefined,
        status: 'succeeded',
        createdAtIso: data.receiptTimestamp || new Date().toISOString(),
      };

      await onSuccessPurchase(receipt);
      setCompletedReceipt(receipt);
    } catch {
      setErrorMsg('Network error contacting payment gateway. Please try again when online.');
    } finally {
      setProcessing(false);
    }
  };

  const cardDigits = cardNumber.replace(/\D/g, '');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plus-checkout-title"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          aria-label="Close checkout"
        >
          <X className="w-5 h-5" />
        </button>

        {completedReceipt ? (
          <div className="p-8 sm:p-10 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {completedReceipt.planId === 'hints_20'
                  ? 'Unlimited Hints Activated!'
                  : 'Ad-Free & Full Benefits Activated'}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {completedReceipt.planId === 'hints_20'
                  ? 'You now have Unlimited Hints across all 100 Guided Paths! Upgrade to ₹200/mo anytime to also remove all ads & unlock AI Coach.'
                  : 'Google AdSense ads are removed across the entire app (including Guided Path completion & Mystery Boxes). AI Coach, Offline Packs, Unlimited Hearts & Unlimited Hints are active.'}
              </p>
            </div>

            <div className="max-w-md mx-auto p-5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {completedReceipt.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-white">
                  {completedReceipt.planId === 'hints_20'
                    ? 'Unlimited Hints (₹20)'
                    : completedReceipt.planId === 'ad_free'
                      ? 'No-Ads Starter (₹200)'
                      : completedReceipt.planId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-semibold uppercase text-slate-900 dark:text-white">
                  {completedReceipt.paymentMethod}
                  {completedReceipt.cardLast4 ? ` •••• ${completedReceipt.cardLast4}` : ''}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total Paid</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrencyAmount(completedReceipt.amountCents, completedReceipt.currency)} {completedReceipt.currency}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setCompletedReceipt(null);
                onClose();
              }}
              className="px-6 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer"
            >
              Return to PIRYAS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Summary Column */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-200 dark:bg-slate-800">
                    {!imgError ? (
                      <img
                        src="/src/assets/images/plus_membership_emblem_1795509266561.jpg"
                        alt="PIRYAS Plus Sapphire and Gold Medallion"
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current tier: <span className="capitalize">{currentPlan}</span>
                    </p>
                    <h2 id="plus-checkout-title" className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      PIRYAS INR Checkout
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const active = plan.id === selectedPlanId;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-slate-900 border-blue-600 ring-1 ring-blue-600/20'
                            : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {plan.name}
                          </span>
                          <span className="font-mono text-sm font-bold tabular-nums text-blue-700 dark:text-blue-400">
                            {plan.priceDisplay}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          {plan.savingsLabel} · {plan.period}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          {plan.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Promo Code (try <span className="font-mono">PIRYAS20</span>)
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrencyAmount(selectedPlan.cents, 'INR')}
                  </span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>Promo PIRYAS20 (20% off)</span>
                    <span className="font-mono tabular-nums">
                      -{formatCurrencyAmount(discountCents, 'INR')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1">
                  <span>Total Due</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrencyAmount(finalCents, 'INR')} INR
                  </span>
                </div>
              </div>
            </div>

            {/* Right Payment Gateway Form */}
            <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Payment Method (INR ₹)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Server-verified payment gateway · Instant Ad-Free & AI Coach activation
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Wallet
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Credit or Debit Card ({detectCardBrand(cardDigits)})
                    </span>
                    <button
                      type="button"
                      onClick={fillSandboxCard}
                      className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Fill Test Card (4242)
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Full name on card"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="12/29"
                        className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                        placeholder="424"
                        className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    UPI Virtual Payment Address
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="learner@okaxis"
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pay with Google Pay, PhonePe, Paytm, or BHIM UPI for instant verification.
                  </p>
                </div>
              )}

              {paymentMethod === 'wallet' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Choose Express Wallet
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Google Pay', 'Apple Pay', 'PayPal'] as const).map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setWalletProvider(provider)}
                        className={`py-3 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                          walletProvider === provider
                            ? 'border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 px-5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {processing
                  ? 'Verifying with Payment Gateway...'
                  : `Pay ${formatCurrencyAmount(finalCents, 'INR')} & Activate Plan`}
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Every subscription includes Ad-Free App, AI Communication Coach & Offline Mode.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
