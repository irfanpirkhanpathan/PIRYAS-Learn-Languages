import React, { useState } from 'react';
import {
  CheckCircle2,
  Crown,
  Heart,
  Receipt,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatCurrencyAmount } from '../data/gamification';
import type { PurchaseReceipt, UserProfile } from '../types/piryas';

import type { PaidPlanChoice } from './PaymentGatewayModal';

interface SubscriptionHubProps {
  profile: UserProfile;
  receipts: PurchaseReceipt[];
  onOpenPlusModal: (planId?: PaidPlanChoice) => void;
  onGoOfflinePacks: () => void;
  onGoAICoach: () => void;
}

export const SubscriptionHub: React.FC<SubscriptionHubProps> = ({
  profile,
  receipts,
  onOpenPlusModal,
  onGoOfflinePacks,
  onGoAICoach,
}) => {
  const [imgError, setImgError] = useState(false);
  const isPlus = profile.subscriptionStatus === 'active';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-50/70 via-slate-50 to-indigo-50/60 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                {isPlus
                  ? `Active Plan · ${profile.subscriptionPlan === 'ad_free' ? 'NO-ADS STARTER (₹200)' : profile.subscriptionPlan.toUpperCase()}`
                  : 'PIRYAS Ad-Free & Plus Membership (INR ₹)'}
              </p>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-balance">
                {isPlus
                  ? 'Ad-Free Learning, AI Coach & Offline Mode Active'
                  : 'Go Ad-Free for ₹200/mo — AI Coach & Offline Included'}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every subscription plan — starting at just <strong>₹200/month</strong> — removes all bottom & Mystery Box Google AdSense ads and unlocks the AI Communication Coach, Offline App Access across all 15 languages, and Unlimited Hearts.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-slate-800/70 border border-blue-200/70 dark:border-slate-700 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      AI Communication Coach
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Included in ₹200 & every plan. Roleplay, word differences & meanings.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-slate-800/70 border border-emerald-200/70 dark:border-slate-700 flex items-start gap-3">
                  <WifiOff className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Offline App & 15 Packs
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Download all 100 Guided Paths & 500 challenges to learn anywhere.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-slate-800/70 border border-rose-200/70 dark:border-slate-700 flex items-start gap-3">
                  <Heart className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Unlimited Hearts + Zero Ads
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Open Mystery Boxes instantly with no ads and unlimited retries.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-800/70 border border-amber-200/70 dark:border-slate-700 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Promo Code PIRYAS20
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Instant 20% off via UPI, Card, or Wallet checkout in Rupees (₹).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenPlusModal('ad_free')}
                className="px-6 py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
              >
                {isPlus ? 'Manage Subscription Plan' : 'Go Ad-Free Now (From ₹200)'}
              </button>
              {!profile.unlimitedHints && !isPlus && (
                <button
                  type="button"
                  onClick={() => onOpenPlusModal('hints_20')}
                  className="px-4 py-3 rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100 cursor-pointer"
                >
                  Unlock Unlimited Hints (₹20)
                </button>
              )}
              {isPlus && (
                <>
                  <button
                    type="button"
                    onClick={onGoAICoach}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Open AI Coach
                  </button>
                  <button
                    type="button"
                    onClick={onGoOfflinePacks}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Manage Offline Packs
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="relative h-full min-h-[260px] bg-slate-100 dark:bg-slate-800">
              {!imgError ? (
                <img
                  src="/src/assets/images/plus_membership_emblem_1795509266561.jpg"
                  alt="PIRYAS Plus Sapphire and Gold Medallion"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs text-slate-200">
                  Verified INR Checkout · UPI, Card & Wallet
                </p>
                <p className="mt-1 font-display text-xl font-bold">
                  100% Ad-Free + AI Coach Starting at ₹200/mo
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Plan Comparison Cards (INR ₹) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent =
              (isPlus && profile.subscriptionPlan === plan.id) ||
              (plan.id === 'hints_20' && profile.unlimitedHints && !isPlus);
            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-slate-900 rounded-xl p-5 border flex flex-col justify-between space-y-5 ${
                  plan.id === 'ad_free' || isCurrent
                    ? 'border-blue-600 ring-1 ring-blue-600/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {plan.savingsLabel}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h2>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {plan.priceDisplay}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{plan.period}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {plan.tagline}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenPlusModal(plan.id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-700 text-white'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Current Active Plan
                    </span>
                  ) : (
                    `Choose ${plan.priceDisplay}`
                  )}
                </button>
              </div>
            );
          })}
        </section>

        {/* Invoices if any */}
        {receipts.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              Verified Payment Receipts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {receipts.map((rec) => (
                <div
                  key={rec.transactionId}
                  className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white capitalize">
                      {rec.planId === 'hints_20'
                        ? 'Unlimited Hints Pass'
                        : rec.planId === 'ad_free'
                          ? 'No-Ads Starter'
                          : `Plus ${rec.planId}`}{' '}
                      · {rec.paymentMethod.toUpperCase()}
                      {rec.cardLast4 ? ` •••• ${rec.cardLast4}` : ''}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">{rec.transactionId}</p>
                  </div>
                  <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrencyAmount(rec.amountCents, rec.currency)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
