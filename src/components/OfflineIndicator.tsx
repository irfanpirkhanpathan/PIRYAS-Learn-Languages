import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  forcedOffline: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ forcedOffline }) => {
  const isOnline = useOnlineStatus();

  if (isOnline && !forcedOffline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        {forcedOffline
          ? 'Offline Study Mode Active · Using cached packs & local sync queue'
          : 'No Connection · Learning offline from cached packs'}
      </span>
    </div>
  );
};
