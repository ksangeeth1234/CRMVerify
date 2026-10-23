import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

interface VerificationProgressBarProps {
  current: number;
  total: number;
  currentName?: string;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  current,
  total,
  currentName,
}) => {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-2 font-bold text-purple-950">
          <Loader2 className="w-4 h-4 text-purple-700 animate-spin" />
          <span>Cross-Referencing Student Records with Master Database...</span>
        </div>
        <span className="font-mono font-bold text-purple-900">{percent}% ({current}/{total})</span>
      </div>

      {/* Bar */}
      <div className="w-full h-2.5 bg-purple-200/70 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-150 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {currentName && (
        <div className="text-[11px] text-purple-700 mt-2 truncate flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Analyzing candidate: <strong>{currentName}</strong></span>
        </div>
      )}
    </div>
  );
};
