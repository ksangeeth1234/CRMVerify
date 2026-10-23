import React, { useState } from 'react';
import { Database, Download, Sparkles, RefreshCw, CheckCircle2, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { generateSampleMasterExcelFile, generateSampleVerificationExcelFile } from '../data/sampleData';

interface HeaderProps {
  masterCount: number;
  masterFileName?: string;
  hasVerificationData: boolean;
  onLoadSampleData: () => void;
  onResetAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  masterCount,
  masterFileName,
  hasVerificationData,
  onLoadSampleData,
  onResetAll,
}) => {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  return (
    <header className="bg-white border-b border-purple-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight block">
                Student Verification System
              </span>
              <span className="text-xs text-purple-700 font-medium hidden sm:block">
                Master Excel Student Database Engine
              </span>
            </div>
          </div>

          {/* Master Status Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            {masterCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-900 rounded-lg border border-purple-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Master:</span>
                <strong className="font-semibold">{masterCount} students</strong>
                <span className="text-slate-400">·</span>
                <span className="truncate max-w-[140px] text-slate-600" title={masterFileName}>
                  {masterFileName}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
                No Master Excel Loaded
              </div>
            )}
          </div>

          {/* Action Zone */}
          <div className="flex items-center gap-2">
            {/* Download Templates Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-3 py-2 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 rounded-lg border border-purple-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download template Excel files to test on your computer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download Samples</span>
                <ChevronDown className="w-3 h-3 text-purple-500" />
              </button>

              {showDownloadMenu && (
                <div
                  className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowDownloadMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Sample Excel Workbooks (.xlsx)
                  </div>
                  <button
                    onClick={() => {
                      generateSampleMasterExcelFile();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Master Database Sample</div>
                      <div className="text-[10px] text-slate-500">All 30 columns with realistic records</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      generateSampleVerificationExcelFile();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Verification List Sample</div>
                      <div className="text-[10px] text-slate-500">10 test cases covering edge cases</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Demo Loader */}
            <button
              onClick={onLoadSampleData}
              className="px-3.5 py-2 text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Instantly load sample Master and sample Verification datasets"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>

            {/* Reset */}
            {(masterCount > 0 || hasVerificationData) && (
              <button
                onClick={onResetAll}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Reset Workspace"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
