import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface ConfirmReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentFileName: string;
  newFileName: string;
}

export const ConfirmReplaceModal: React.FC<ConfirmReplaceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentFileName,
  newFileName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            Replace Master Student Database?
          </h3>

          <p className="text-sm text-slate-600 mt-2">
            You currently have <strong className="text-slate-800">{currentFileName}</strong> loaded as your Master Student Database.
          </p>

          <p className="text-xs text-slate-500 mt-2">
            Replacing it with <strong className="text-slate-800">{newFileName}</strong> will clear any in-progress verification results and reset candidate matches against the new dataset.
          </p>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Your source files on your computer will remain completely untouched. Data is processed locally in browser session memory.
            </span>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-sm transition-colors"
            >
              Yes, Replace Master Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
