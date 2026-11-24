import React, { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

interface GoogleAdSlotProps {
  variant: 'bottom' | 'mystery' | 'completion';
  isAdFree: boolean;
  onUpgradeAdFree: () => void;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const ADSENSE_CLIENT =
  (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined)?.trim() || '';
const ADSENSE_SLOT_BOTTOM =
  (import.meta.env.VITE_ADSENSE_SLOT_BOTTOM as string | undefined)?.trim() || '';
const ADSENSE_SLOT_MYSTERY =
  (import.meta.env.VITE_ADSENSE_SLOT_MYSTERY as string | undefined)?.trim() || '';

export const GoogleAdSlot: React.FC<GoogleAdSlotProps> = ({
  variant,
  isAdFree,
  onUpgradeAdFree,
}) => {
  const pushedRef = useRef(false);

  const slotId =
    variant === 'mystery' || variant === 'completion'
      ? ADSENSE_SLOT_MYSTERY || ADSENSE_SLOT_BOTTOM
      : ADSENSE_SLOT_BOTTOM;
  const hasLiveAdSense = Boolean(ADSENSE_CLIENT && slotId);

  useEffect(() => {
    if (isAdFree || !hasLiveAdSense) return;

    const scriptId = 'piryas-google-adsense-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        ADSENSE_CLIENT
      )}`;
      document.head.appendChild(s);
    }

    if (!pushedRef.current) {
      pushedRef.current = true;
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        // Ignore preview AdSense sandbox errors
      }
    }
  }, [isAdFree, hasLiveAdSense]);

  if (isAdFree) return null;

  if (variant === 'mystery' || variant === 'completion') {
    const label =
      variant === 'completion'
        ? 'Google AdSense · Guided Path Completion Break'
        : 'Google AdSense · Rewarded Mystery Box Sponsor';

    return (
      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/60 p-4 space-y-3 text-left">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span>{label}</span>
          <button
            type="button"
            onClick={onUpgradeAdFree}
            className="text-blue-700 dark:text-blue-400 hover:underline font-bold cursor-pointer"
          >
            Remove All Ads (₹200)
          </button>
        </div>

        {hasLiveAdSense ? (
          <ins
            className="adsbygoogle block w-full min-h-[120px]"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="rounded-lg bg-white/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                PIRYAS Ad-Free Subscription · Only ₹200/month
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Zero ads after Guided Paths or Mystery Boxes, plus AI Communication Coach, Offline Mode & Unlimited Hints.
              </p>
            </div>
            <button
              type="button"
              onClick={onUpgradeAdFree}
              className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              No Ads ₹200
            </button>
          </div>
        )}
      </div>
    );
  }

  // Compact bottom Google AdSense bar (respects 15% mobile height budget)
  return (
    <aside
      aria-label="Google AdSense Advertisement"
      className="sticky bottom-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        {hasLiveAdSense ? (
          <div className="flex-1 min-w-0 max-h-[52px] overflow-hidden">
            <ins
              className="adsbygoogle block w-full h-[50px]"
              style={{ display: 'block' }}
              data-ad-client={ADSENSE_CLIENT}
              data-ad-slot={slotId}
              data-ad-format="horizontal"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0">
              AD · AdSense
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
              Remove all ads & unlock AI Coach + Offline Mode with PIRYAS Ad-Free for just ₹200/mo.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onUpgradeAdFree}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          No Ads · ₹200
        </button>
      </div>
    </aside>
  );
};
