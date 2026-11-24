import React, { useState } from 'react';
import { Check, Copy, Crown, Gift, Share2, Sparkles, Users } from 'lucide-react';
import type { UserProfile } from '../types/piryas';

interface ReferEarnCardProps {
  profile: UserProfile;
  onRedeemReferral: (code: string) => { ok: boolean; message: string };
  onOpenPlusModal: () => void;
}

export const ReferEarnCard: React.FC<ReferEarnCardProps> = ({
  profile,
  onRedeemReferral,
  onOpenPlusModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const shareText = `Join me on PIRYAS to master 15 languages with 100 Guided Paths, native voices & offline packs! Use referral code ${profile.referralCode} for +150 XP & +50 Gems.`;

  const handleCopyInvite = async () => {
    try {
      const url = `${window.location.origin}/?ref=${encodeURIComponent(profile.referralCode)}`;
      await navigator.clipboard.writeText(`${shareText} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCode.trim()) return;
    const res = onRedeemReferral(friendCode.trim().toUpperCase());
    setStatusMsg({ ok: res.ok, text: res.message });
    if (res.ok) setFriendCode('');
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Filled & Highlighted Refer & Earn Card */}
      <div className="lg:col-span-7 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white border border-emerald-500 rounded-2xl p-6 space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              Refer & Earn Highlight · +150 XP & +50 Gems Every Friend
            </p>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
              Invite Friends & Boost Your Leaderboard Rank
            </h2>
          </div>

          <div className="text-left sm:text-right tabular-nums bg-white/15 px-4 py-2 rounded-xl backdrop-blur-xs shrink-0">
            <p className="text-[11px] text-emerald-100">Friends Joined</p>
            <p className="font-mono text-lg font-bold text-white flex items-center sm:justify-end gap-1.5">
              <Users className="w-4 h-4 text-amber-200" />
              {profile.referralsCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-300 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-slate-800">
              Your Highlighted Referral Code
            </p>
            <p className="mt-0.5 font-mono text-xl font-extrabold tracking-wider text-slate-950">
              {profile.referralCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyInvite}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Invite Link Copied!' : 'Copy & Share Code'}
            {!copied && <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Redeem Friend Referral Code */}
        <form onSubmit={handleRedeem} className="space-y-2">
          <label
            htmlFor="redeem-referral-input"
            className="block text-xs font-semibold text-emerald-50"
          >
            Redeem a friend’s code for instant points (try <span className="font-mono font-bold text-amber-200">PIRYAS-WELCOME</span>)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="redeem-referral-input"
              type="text"
              disabled={Boolean(profile.referredBy)}
              value={profile.referredBy || friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              placeholder="PIRYAS-XXXXX"
              className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase rounded-xl bg-white/95 text-slate-900 placeholder:text-slate-400 border border-emerald-300 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={Boolean(profile.referredBy) || !friendCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-300 text-slate-950 text-xs font-extrabold hover:bg-amber-200 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {profile.referredBy ? 'Redeemed' : 'Claim +150 XP'}
            </button>
          </div>
          {statusMsg && (
            <p className={`text-xs font-bold ${statusMsg.ok ? 'text-amber-200' : 'text-rose-200'}`}>
              {statusMsg.text}
            </p>
          )}
        </form>
      </div>

      {/* Subscription Highlight Card */}
      <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 text-white rounded-2xl p-6 flex flex-col justify-between space-y-5 border border-indigo-500 shadow-md">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200">
              <Crown className="w-4 h-4 text-amber-300" />
              {profile.subscriptionStatus === 'active'
                ? `Active · ${profile.subscriptionPlan === 'ad_free' ? 'NO-ADS ₹200' : profile.subscriptionPlan.toUpperCase()}`
                : 'Go Ad-Free for Just ₹200/mo'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>

          <h3 className="font-display text-xl font-bold">
            {profile.subscriptionStatus === 'active'
              ? 'Ad-Free + AI Coach + Offline Active'
              : 'Remove Ads & Unlock AI Coach for ₹200'}
          </h3>

          <ul className="space-y-1.5 text-xs text-blue-100 leading-relaxed">
            <li>• Zero bottom or Mystery Box Google AdSense ads</li>
            <li>• AI Communication Coach works in ₹200 & all plans</li>
            <li>• Offline App Access + Unlimited Hearts + Promo PIRYAS20</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onOpenPlusModal}
          className="w-full py-3 px-4 rounded-xl bg-white text-indigo-950 text-xs font-extrabold hover:bg-amber-100 transition-colors cursor-pointer"
        >
          {profile.subscriptionStatus === 'active'
            ? 'Manage Subscription Plan'
            : 'Unlock Ad-Free & AI Coach (₹200)'}
        </button>
      </div>
    </section>
  );
};
