import React, { useRef, useState } from 'react';
import {
  Upload,
  UserCheck,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { ColumnMapping, SearchFieldConfig, LoadedFileInfo } from '../types';
import { generateSampleVerificationExcelFile } from '../data/sampleData';

interface VerificationUploadSectionProps {
  verificationInfo: LoadedFileInfo | null;
  uploadedRows: Record<string, any>[];
  mapping: ColumnMapping;
  onUpdateMapping: (key: keyof ColumnMapping, value: string) => void;
  config: SearchFieldConfig;
  onUpdateConfig: (updater: (prev: SearchFieldConfig) => SearchFieldConfig) => void;
  onFileUpload: (file: File) => void;
  onSelectSheet: (sheetName: string) => void;
  onStartVerification: () => void;
  isMasterLoaded: boolean;
  isVerifying: boolean;
}

export const VerificationUploadSection: React.FC<VerificationUploadSectionProps> = ({
  verificationInfo,
  uploadedRows,
  mapping,
  onUpdateMapping,
  config,
  onUpdateConfig,
  onFileUpload,
  onSelectSheet,
  onStartVerification,
  isMasterLoaded,
  isVerifying,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfigSettings, setShowConfigSettings] = useState(true);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      alert('Please select a valid Excel workbook (.xlsx or .xls).');
      return;
    }
    onFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Check if at least one field mapping is assigned
  const hasAtLeastOneMapping =
    Boolean(mapping.studentNumber && config.checkStudentNumber) ||
    Boolean(mapping.nic && config.checkNIC) ||
    Boolean(mapping.email && config.checkEmail) ||
    Boolean(mapping.mobile && config.checkMobile) ||
    Boolean(mapping.studentName && config.checkStudentName);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-purple-950 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-purple-300 border border-white/10">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Student Verification Upload
              {verificationInfo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/40">
                  {verificationInfo.rowCount} Records
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300">
              Upload incoming student batch to verify against the Master Database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {verificationInfo ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors cursor-pointer"
            >
              Change File
            </button>
          ) : (
            <button
              onClick={generateSampleVerificationExcelFile}
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Test Template</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="p-6">
        {/* Upload Dropzone */}
        {!verificationInfo ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-purple-600 bg-purple-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50/70'
            }`}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Upload Excel File to Be Verified (.xlsx, .xls)
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
              Upload any workbook containing student names, IDs, NICs, emails, or phone numbers. Column names don't need to match the Master file.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 bg-slate-100 rounded-md font-mono">.xlsx</span>
              <span className="px-2 py-1 bg-slate-100 rounded-md font-mono">.xls</span>
              <span>·</span>
              <span>Auto-detects matching columns</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{verificationInfo.fileName}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      ({(verificationInfo.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                    <span>
                      Records to Verify: <strong className="text-indigo-600 font-semibold">{verificationInfo.rowCount}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Columns: <strong className="text-slate-800">{verificationInfo.columnCount}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-sheet selection */}
              {verificationInfo.sheetNames.length > 1 && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-slate-600 font-medium">Worksheet:</span>
                  <select
                    value={verificationInfo.selectedSheet}
                    onChange={(e) => onSelectSheet(e.target.value)}
                    className="text-xs font-semibold text-slate-800 bg-transparent pr-6 focus:outline-hidden cursor-pointer"
                  >
                    {verificationInfo.sheetNames.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Column Mapping Section */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Target Column Mapping</span>
                    <span className="text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Smart Auto-Detected
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Match the fields from your uploaded workbook to the corresponding search categories.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfigSettings(!showConfigSettings)}
                  className="text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showConfigSettings ? 'Hide Search Priority' : 'Configure Search Priority'}</span>
                </button>
              </div>

              {/* 5 Field Mapping Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {/* 1. Student Number */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">1</span>
                      Student Number
                    </label>
                    <input
                      type="checkbox"
                      checked={config.checkStudentNumber}
                      onChange={(e) =>
                        onUpdateConfig((prev) => ({ ...prev, checkStudentNumber: e.target.checked }))
                      }
                      title="Include in search criteria"
                      className="accent-purple-700 rounded cursor-pointer"
                    />
                  </div>
                  <select
                    value={mapping.studentNumber}
                    onChange={(e) => onUpdateMapping('studentNumber', e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2 focus:outline-hidden focus:border-purple-600 cursor-pointer"
                  >
                    <option value="">(Not in file)</option>
                    {verificationInfo.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    Maps to Master: <strong className="text-slate-700">StudentNumber</strong>
                  </div>
                </div>

                {/* 2. NIC */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">2</span>
                      National ID (NIC)
                    </label>
                    <input
                      type="checkbox"
                      checked={config.checkNIC}
                      onChange={(e) =>
                        onUpdateConfig((prev) => ({ ...prev, checkNIC: e.target.checked }))
                      }
                      title="Include in search criteria"
                      className="accent-purple-700 rounded cursor-pointer"
                    />
                  </div>
                  <select
                    value={mapping.nic}
                    onChange={(e) => onUpdateMapping('nic', e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2 focus:outline-hidden focus:border-purple-600 cursor-pointer"
                  >
                    <option value="">(Not in file)</option>
                    {verificationInfo.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    Maps to Master: <strong className="text-slate-700">nic</strong>
                  </div>
                </div>

                {/* 3. Email */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">3</span>
                      Email Address
                    </label>
                    <input
                      type="checkbox"
                      checked={config.checkEmail}
                      onChange={(e) =>
                        onUpdateConfig((prev) => ({ ...prev, checkEmail: e.target.checked }))
                      }
                      title="Include in search criteria"
                      className="accent-purple-700 rounded cursor-pointer"
                    />
                  </div>
                  <select
                    value={mapping.email}
                    onChange={(e) => onUpdateMapping('email', e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2 focus:outline-hidden focus:border-purple-600 cursor-pointer"
                  >
                    <option value="">(Not in file)</option>
                    {verificationInfo.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    Maps to Master: <strong className="text-slate-700">email</strong>
                  </div>
                </div>

                {/* 4. Mobile */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">4</span>
                      Mobile Number
                    </label>
                    <input
                      type="checkbox"
                      checked={config.checkMobile}
                      onChange={(e) =>
                        onUpdateConfig((prev) => ({ ...prev, checkMobile: e.target.checked }))
                      }
                      title="Include in search criteria"
                      className="accent-purple-700 rounded cursor-pointer"
                    />
                  </div>
                  <select
                    value={mapping.mobile}
                    onChange={(e) => onUpdateMapping('mobile', e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2 focus:outline-hidden focus:border-purple-600 cursor-pointer"
                  >
                    <option value="">(Not in file)</option>
                    {verificationInfo.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    Maps to Master: <strong className="text-slate-700">mobile</strong>
                  </div>
                </div>

                {/* 5. Student Name */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">5</span>
                      Student Name
                    </label>
                    <input
                      type="checkbox"
                      checked={config.checkStudentName}
                      onChange={(e) =>
                        onUpdateConfig((prev) => ({ ...prev, checkStudentName: e.target.checked }))
                      }
                      title="Include in search criteria"
                      className="accent-purple-700 rounded cursor-pointer"
                    />
                  </div>
                  <select
                    value={mapping.studentName}
                    onChange={(e) => onUpdateMapping('studentName', e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2 focus:outline-hidden focus:border-purple-600 cursor-pointer"
                  >
                    <option value="">(Not in file)</option>
                    {verificationInfo.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">
                    Maps to Master: <strong className="text-slate-700">StudentName</strong>
                  </div>
                </div>
              </div>

              {/* Advanced Search Priority & Fuzzy Matching Settings */}
              {showConfigSettings && (
                <div className="pt-3 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-700 shrink-0" />
                    <span className="text-slate-600">
                      <strong>Search Priority Order:</strong> 1. StudentNumber → 2. NIC → 3. Email → 4. Mobile → 5. Student Name
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.fuzzyNameMatching}
                        onChange={(e) =>
                          onUpdateConfig((prev) => ({ ...prev, fuzzyNameMatching: e.target.checked }))
                        }
                        className="accent-purple-700 rounded"
                      />
                      <span className="font-medium text-slate-800">
                        Enable Name Fuzzy Matching (Spelling Variations)
                      </span>
                    </label>

                    {config.fuzzyNameMatching && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Threshold:</span>
                        <input
                          type="range"
                          min="0.65"
                          max="0.95"
                          step="0.05"
                          value={config.fuzzyThreshold}
                          onChange={(e) =>
                            onUpdateConfig((prev) => ({
                              ...prev,
                              fuzzyThreshold: parseFloat(e.target.value),
                            }))
                          }
                          className="accent-purple-700 w-20 cursor-pointer"
                        />
                        <span className="font-mono font-semibold text-purple-800">
                          {Math.round(config.fuzzyThreshold * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Records Quick Preview Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Uploaded Rows Preview (First 5 Rows)
                </span>
                <span className="text-xs text-slate-500">
                  Ready to verify against Master database
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">#</th>
                      {verificationInfo.columns.slice(0, 6).map((col) => (
                        <th key={col} className="py-2 px-3">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uploadedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        {verificationInfo.columns.slice(0, 6).map((col) => (
                          <td key={col} className="py-2 px-3 text-slate-700 truncate max-w-[160px]">
                            {String(row[col] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Launch Verification Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-purple-50/70 rounded-xl border border-purple-200">
              <div className="text-xs text-purple-900">
                {!isMasterLoaded ? (
                  <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Please upload the Master Student Database above before running verification.</span>
                  </div>
                ) : !hasAtLeastOneMapping ? (
                  <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Please enable at least one search column mapping to begin matching.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Ready to cross-reference <strong>{verificationInfo.rowCount} uploaded records</strong> against the Master Database.
                    </span>
                  </div>
                )}
              </div>

              <button
                disabled={!isMasterLoaded || !hasAtLeastOneMapping || isVerifying}
                onClick={onStartVerification}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Records...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Student Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
