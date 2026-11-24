import React from 'react';
import { Crown, Flame, Sparkles } from 'lucide-react';
import { AVATAR_FRAMES } from '../data/gamification';

interface AvatarFrameProps {
  name: string;
  frameId: string;
  size?: 'sm' | 'md' | 'lg';
  isPlus?: boolean;
}

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  name,
  frameId,
  size = 'md',
  isPlus = false,
}) => {
  const frame = AVATAR_FRAMES.find((f) => f.id === frameId) || AVATAR_FRAMES[0];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PY';

  const dimensions =
    size === 'sm'
      ? 'w-9 h-9 text-xs'
      : size === 'lg'
        ? 'w-20 h-20 text-xl'
        : 'w-11 h-11 text-sm';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <div
        className={`${dimensions} ${frame.ringClass} rounded-full bg-slate-900 dark:bg-slate-800 text-white font-semibold flex items-center justify-center select-none`}
        title={`${frame.name} Frame`}
      >
        {initials}
      </div>
      {frameId === 'obsidian_crown' || isPlus ? (
        <span
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center border-2 border-white dark:border-slate-900"
          title="PIRYAS Plus"
        >
          <Crown className="w-2.5 h-2.5" />
        </span>
      ) : frameId === 'amber_flame' ? (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
          <Flame className="w-2.5 h-2.5" />
        </span>
      ) : frameId === 'sakura_gold' ? (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center border-2 border-white dark:border-slate-900">
          <Sparkles className="w-2.5 h-2.5" />
        </span>
      ) : null}
    </div>
  );
};
