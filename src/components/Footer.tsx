import React from 'react';
import { ShieldCheck, Heart, Database, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Master Student Verification System</span>
            <span>·</span>
            <span>Educational Administration Suite</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              100% Client-Side Privacy (No external AI transmission)
            </span>
          </div>

          <div className="flex items-center gap-1 font-medium text-slate-700">
            <span>Developed by</span>
            <span className="font-bold text-purple-700">PicoZen</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
