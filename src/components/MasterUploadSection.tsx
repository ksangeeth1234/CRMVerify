import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronDown,
  RefreshCw,
  Search,
  Check,
  Info,
  Download,
  Eye,
} from 'lucide-react';
import { MASTER_COLUMNS, MasterStudent, LoadedFileInfo } from '../types';
import { generateSampleMasterExcelFile } from '../data/sampleData';

interface MasterUploadSectionProps {
  masterInfo: LoadedFileInfo | null;
  masterRecords: MasterStudent[];
  rawSheetsData?: Record<string, any[]>;
  onFileUpload: (file: File) => void;
  onSelectSheet: (sheetName: string) => void;
  onRequestReplace: (file: File) => void;
  onInspectRecord?: (record: MasterStudent) => void;
  isLoading: boolean;
}

export const MasterUploadSection: React.FC<MasterUploadSectionProps> = ({
  masterInfo,
  masterRecords,
  onFileUpload,
  onSelectSheet,
  onRequestReplace,
  onInspectRecord,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const previewPageSize = 5;

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

    if (masterInfo) {
      onRequestReplace(file);
    } else {
      onFileUpload(file);
    }
    // Reset file input value so re-selecting same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter preview records
  const filteredRecords = masterRecords.filter((rec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(rec.StudentName || '').toLowerCase().includes(q) ||
      String(rec.StudentNumber || '').toLowerCase().includes(q) ||
      String(rec.nic || '').toLowerCase().includes(q) ||
      String(rec.email || '').toLowerCase().includes(q) ||
      String(rec.Course || '').toLowerCase().includes(q) ||
      String(rec.AcademicBranch || '').toLowerCase().includes(q)
    );
  });

  const totalPreviewPages = Math.ceil(filteredRecords.length / previewPageSize) || 1;
  const paginatedPreview = filteredRecords.slice(
    (previewPage - 1) * previewPageSize,
    previewPage * previewPageSize
  );

  // Check which standard Master columns exist in loaded file
  const detectedMasterColumns = masterInfo
    ? MASTER_COLUMNS.filter((col) => masterInfo.columns.includes(col))
    : [];

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-purple-200 border border-white/10">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Master Student Database
              {masterInfo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              )}
            </h2>
            <p className="text-xs text-purple-200">
              Primary student registry containing all master records and historical data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {masterInfo ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace Workbook</span>
            </button>
          ) : (
            <button
              onClick={generateSampleMasterExcelFile}
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Master Template</span>
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
        {/* Upload Dropzone (if no master loaded, or replacement mode) */}
        {!masterInfo ? (
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
              Upload Master Excel Workbook (.xlsx, .xls)
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
              Drag and drop your existing master spreadsheet here, or browse files on your computer. Supports multi-worksheet workbooks.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 bg-slate-100 rounded-md font-mono">.xlsx</span>
              <span className="px-2 py-1 bg-slate-100 rounded-md font-mono">.xls</span>
              <span>·</span>
              <span>All 30 Master Columns Preserved Intact</span>
            </div>
          </div>
        ) : (
          /* Loaded Master Details & Preview */
          <div className="space-y-6">
            {/* Metadata Summary Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{masterInfo.fileName}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      ({(masterInfo.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                    <span>
                      Total Students: <strong className="text-purple-700 font-semibold">{masterInfo.rowCount}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Columns: <strong className="text-slate-800">{masterInfo.columnCount} detected</strong>
                    </span>
                    <span>·</span>
                    <span className="text-slate-500">
                      Loaded at {new Date(masterInfo.loadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sheet Selection Dropdown if multiple sheets exist */}
              {masterInfo.sheetNames.length > 1 && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-slate-600 font-medium">Worksheet:</span>
                  <div className="relative">
                    <select
                      value={masterInfo.selectedSheet}
                      onChange={(e) => onSelectSheet(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent pr-6 focus:outline-hidden cursor-pointer"
                    >
                      {masterInfo.sheetNames.map((sheet) => (
                        <option key={sheet} value={sheet}>
                          {sheet}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Column Detection Status Indicator */}
            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-purple-700" />
                  Master Columns Detected ({detectedMasterColumns.length} of {MASTER_COLUMNS.length} verified):
                </span>
                <span className="text-[11px] text-slate-500">Original column names preserved</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {MASTER_COLUMNS.map((col) => {
                  const isPresent = masterInfo.columns.includes(col);
                  return (
                    <span
                      key={col}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                        isPresent
                          ? 'bg-purple-100/70 text-purple-800 border-purple-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                      }`}
                      title={isPresent ? `Column '${col}' is present` : `Column '${col}' was not detected in this sheet`}
                    >
                      {col}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Records Preview Table */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Master Records Preview & Quick Filter
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    (Showing {paginatedPreview.length} of {filteredRecords.length})
                  </span>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by student name, number, NIC, course..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPreviewPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-500 focus:bg-white transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600 bg-slate-200 px-1 rounded cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Live Search Status Feedback Banner */}
              {searchQuery.trim() && (
                <div className="mb-3 px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 border bg-purple-50/70 border-purple-200 text-purple-900">
                  <div className="flex items-center gap-2">
                    {filteredRecords.length > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <Check className="w-4 h-4" />
                        <span>FOUND: {filteredRecords.length} student record(s) matching "{searchQuery}"</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                        <span>NOT FOUND: No student record matching "{searchQuery}" in this Master sheet</span>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[11px]">Searched across {masterRecords.length} loaded records</span>
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">StudentNumber</th>
                      <th className="py-2.5 px-3">StudentName</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">AcademicBranch</th>
                      <th className="py-2.5 px-3">NIC</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Intake</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPreview.length > 0 ? (
                      paginatedPreview.map((rec, i) => (
                        <tr key={i} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {(previewPage - 1) * previewPageSize + i + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-purple-700">
                            {rec.StudentNumber || '—'}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {rec.StudentName || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-600 max-w-[180px] truncate" title={rec.Course}>
                            {rec.Course || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {rec.AcademicBranch || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700">
                            {rec.nic || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700">
                            {rec.mobile || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-600 max-w-[150px] truncate" title={rec.email}>
                            {rec.email || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {rec.IntakeMonth} {rec.IntakeYear}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                              {rec.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {onInspectRecord && (
                              <button
                                onClick={() => onInspectRecord(rec)}
                                className="px-2 py-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="View all 30 Master columns for this student"
                              >
                                <Eye className="w-3 h-3" />
                                <span>All Fields</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-400 italic">
                          No student records found matching "{searchQuery}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Preview Pagination */}
              {totalPreviewPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5">
                  <span>
                    Page {previewPage} of {totalPreviewPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={previewPage >= totalPreviewPages}
                      onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Session Persistence Explanatory Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Browser Session Storage Policy:</strong> Master student data is held securely in active browser session memory and verified 100% locally on your computer. Student data is never sent to external AI APIs. If you refresh or close this browser tab, simply re-upload your Master Excel workbook to continue.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
