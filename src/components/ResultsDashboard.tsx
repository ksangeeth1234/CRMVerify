import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Users,
  Search,
  Download,
  Filter,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { VerificationResult, VerificationStatus, MasterStudent } from '../types';
import { exportToExcel, exportToCSV } from '../utils/excel';

interface ResultsDashboardProps {
  results: VerificationResult[];
  onInspectResult: (result: VerificationResult) => void;
  onUpdateStatus: (resultId: string, newStatus: VerificationStatus, selectedRecord?: MasterStudent, notes?: string) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  onInspectResult,
  onUpdateStatus,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'row' | 'name' | 'status' | 'matchedField'>('row');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Compute counts for summary cards
  const stats = useMemo(() => {
    let verified = 0;
    let notFound = 0;
    let possibleMatches = 0;
    let multipleMatches = 0;
    let reviewRequired = 0;
    let insufficientInfo = 0;

    results.forEach((r) => {
      const status = r.manualOverrideStatus || r.status;
      if (status === 'Verified') verified++;
      else if (status === 'Not Found') notFound++;
      else if (status === 'Possible Match') possibleMatches++;
      else if (status === 'Multiple Matches') multipleMatches++;
      else if (status === 'Manual Review Required') reviewRequired++;
      else if (status === 'Insufficient Info') insufficientInfo++;
    });

    return {
      total: results.length,
      verified,
      notFound,
      possibleMatches,
      multipleMatches,
      reviewRequired,
      insufficientInfo,
    };
  }, [results]);

  // Filter & Search logic
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const effectiveStatus = r.manualOverrideStatus || r.status;

      // Status filter tab
      if (selectedFilter !== 'All') {
        if (selectedFilter === 'Verified' && effectiveStatus !== 'Verified') return false;
        if (selectedFilter === 'Not Found' && effectiveStatus !== 'Not Found') return false;
        if (selectedFilter === 'Possible Match' && effectiveStatus !== 'Possible Match') return false;
        if (selectedFilter === 'Multiple Matches' && effectiveStatus !== 'Multiple Matches') return false;
        if (selectedFilter === 'Manual Review' && effectiveStatus !== 'Manual Review Required') return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const master = r.manualSelectedMasterRecord || r.matchedMasterRecord;
        const match =
          r.uploadedStudentName.toLowerCase().includes(q) ||
          r.uploadedStudentNumber.toLowerCase().includes(q) ||
          r.uploadedNIC.toLowerCase().includes(q) ||
          r.uploadedEmail.toLowerCase().includes(q) ||
          r.uploadedMobile.toLowerCase().includes(q) ||
          (master?.StudentName && master.StudentName.toLowerCase().includes(q)) ||
          (master?.StudentNumber && master.StudentNumber.toLowerCase().includes(q)) ||
          (master?.Course && master.Course.toLowerCase().includes(q)) ||
          r.matchingField.toLowerCase().includes(q) ||
          r.statusReason.toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [results, selectedFilter, searchQuery]);

  // Sorting
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'row') {
        comparison = a.rowNumber - b.rowNumber;
      } else if (sortField === 'name') {
        comparison = (a.uploadedStudentName || '').localeCompare(b.uploadedStudentName || '');
      } else if (sortField === 'status') {
        const statusA = a.manualOverrideStatus || a.status;
        const statusB = b.manualOverrideStatus || b.status;
        comparison = statusA.localeCompare(statusB);
      } else if (sortField === 'matchedField') {
        comparison = a.matchingField.localeCompare(b.matchingField);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredResults, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / pageSize) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedResults.slice(start, start + pageSize);
  }, [sortedResults, currentPage, pageSize]);

  const handleSort = (field: 'row' | 'name' | 'status' | 'matchedField') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExport = (format: 'xlsx' | 'csv', filterChoice: string) => {
    const filename = `Student_Verification_Report_${filterChoice.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    if (format === 'xlsx') {
      exportToExcel(results, filename, filterChoice);
    } else {
      exportToCSV(results, filename, filterChoice);
    }
    setShowExportMenu(false);
  };

  const renderStatusBadge = (status: VerificationStatus, isOverridden: boolean) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified</span>
            {isOverridden && <span className="text-[10px] text-emerald-600 font-normal">(Manual)</span>}
          </span>
        );
      case 'Possible Match':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3 h-3" />
            <span>Possible Match</span>
            {isOverridden && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
          </span>
        );
      case 'Multiple Matches':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Users className="w-3 h-3" />
            <span>Multiple Matches</span>
            {isOverridden && <span className="text-[10px] text-blue-600 font-normal">(Manual)</span>}
          </span>
        );
      case 'Manual Review Required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3" />
            <span>Review Required</span>
            {isOverridden && <span className="text-[10px] text-rose-600 font-normal">(Manual)</span>}
          </span>
        );
      case 'Insufficient Info':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">
            <span>Insufficient Info</span>
          </span>
        );
      case 'Not Found':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span>Not Found</span>
          </span>
        );
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Verification Results Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-matched against the Master Excel database with priority rules and conflict detection
          </p>
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Verification Report</span>
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Choose Format & Subset
              </div>

              {/* Excel Exports */}
              <div className="py-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                  Excel Workbook (.xlsx)
                </div>
                <button
                  onClick={() => handleExport('xlsx', 'All')}
                  className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 cursor-pointer"
                >
                  All Verification Results ({stats.total})
                </button>
                <button
                  onClick={() => handleExport('xlsx', 'Verified')}
                  className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 cursor-pointer"
                >
                  Verified Students Only ({stats.verified})
                </button>
                <button
                  onClick={() => handleExport('xlsx', 'Not Found')}
                  className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 cursor-pointer"
                >
                  Students Not Found ({stats.notFound})
                </button>
                <button
                  onClick={() => handleExport('xlsx', 'Possible Match')}
                  className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 cursor-pointer"
                >
                  Possible Matches Only ({stats.possibleMatches})
                </button>
                <button
                  onClick={() => handleExport('xlsx', 'Manual Review Required')}
                  className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 cursor-pointer"
                >
                  Manual Review Required ({stats.reviewRequired})
                </button>
              </div>

              {/* CSV Exports */}
              <div className="py-1 border-t border-slate-100">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-700">
                  CSV Spreadsheet (.csv)
                </div>
                <button
                  onClick={() => handleExport('csv', 'All')}
                  className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Download All as CSV ({stats.total})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div
          onClick={() => { setSelectedFilter('All'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'All'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-600/20'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Uploaded
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono tabular-nums">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Students in batch</div>
        </div>

        {/* Verified */}
        <div
          onClick={() => { setSelectedFilter('Verified'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'Verified'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/20'
              : 'bg-slate-50 border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
            <span>Verified</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono tabular-nums">
            {stats.verified}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">
            {stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}% verified` : '0%'}
          </div>
        </div>

        {/* Not Found */}
        <div
          onClick={() => { setSelectedFilter('Not Found'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'Not Found'
              ? 'bg-slate-200/80 border-slate-400 ring-2 ring-slate-600/20'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Not Found
          </div>
          <div className="text-2xl font-black text-slate-700 mt-1 font-mono tabular-nums">
            {stats.notFound}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">No match found</div>
        </div>

        {/* Possible Matches */}
        <div
          onClick={() => { setSelectedFilter('Possible Match'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'Possible Match'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-600/20'
              : 'bg-slate-50 border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
            <span>Possible Match</span>
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono tabular-nums">
            {stats.possibleMatches}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Fuzzy/Name variants</div>
        </div>

        {/* Multiple Matches */}
        <div
          onClick={() => { setSelectedFilter('Multiple Matches'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'Multiple Matches'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-600/20'
              : 'bg-slate-50 border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center justify-between">
            <span>Multiple Matches</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono tabular-nums">
            {stats.multipleMatches}
          </div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Duplicate candidates</div>
        </div>

        {/* Manual Review Required */}
        <div
          onClick={() => { setSelectedFilter('Manual Review'); setCurrentPage(1); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedFilter === 'Manual Review'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-600/20'
              : 'bg-slate-50 border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center justify-between">
            <span>Review Required</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono tabular-nums">
            {stats.reviewRequired}
          </div>
          <div className="text-[10px] text-rose-600/80 mt-0.5">Conflicting fields</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        {/* Segmented Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'All', label: 'All Results', count: stats.total },
            { id: 'Verified', label: 'Verified', count: stats.verified },
            { id: 'Possible Match', label: 'Possible Match', count: stats.possibleMatches },
            { id: 'Multiple Matches', label: 'Multiple Matches', count: stats.multipleMatches },
            { id: 'Manual Review', label: 'Review Required', count: stats.reviewRequired },
            { id: 'Not Found', label: 'Not Found', count: stats.notFound },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedFilter === tab.id ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input & Page Size Selector */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search student, ID, NIC, course..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-purple-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Detailed Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th
                onClick={() => handleSort('row')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors w-14"
              >
                <div className="flex items-center gap-1">
                  <span>Row</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Uploaded Student</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Matched Master Record</th>
              <th
                onClick={() => handleSort('matchedField')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Matching Field</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Verification Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Relevant Master Details</th>
              <th className="py-3 px-3 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedResults.length > 0 ? (
              paginatedResults.map((item) => {
                const effectiveStatus = item.manualOverrideStatus || item.status;
                const master = item.manualSelectedMasterRecord || item.matchedMasterRecord;
                const isOverridden = Boolean(item.manualOverrideStatus);

                return (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors group">
                    {/* Row Number */}
                    <td className="py-3 px-3 font-mono text-slate-400">
                      #{item.rowNumber}
                    </td>

                    {/* Uploaded Student Info */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {item.uploadedStudentName || <span className="text-slate-400 italic font-normal">Blank Name</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {item.uploadedStudentNumber && (
                          <span className="font-mono text-slate-700">ID: {item.uploadedStudentNumber}</span>
                        )}
                        {item.uploadedNIC && (
                          <span className="font-mono">NIC: {item.uploadedNIC}</span>
                        )}
                        {item.uploadedMobile && (
                          <span className="font-mono">Tel: {item.uploadedMobile}</span>
                        )}
                      </div>
                    </td>

                    {/* Matched Master Record */}
                    <td className="py-3 px-3">
                      {master ? (
                        <div>
                          <div className="font-bold text-purple-950 flex items-center gap-1">
                            <span>{master.StudentName}</span>
                            {master.StudentNumber && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                                {master.StudentNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            NIC: <span className="font-mono text-slate-700">{master.nic || 'N/A'}</span>
                            {master.email && <span> · {master.email}</span>}
                          </div>
                        </div>
                      ) : item.possibleMatches.length > 1 ? (
                        <div className="text-xs text-blue-700 font-medium">
                          {item.possibleMatches.length} Candidates Available
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Matching Field */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{item.matchingField}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={item.statusReason}>
                        {item.statusReason}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderStatusBadge(effectiveStatus, isOverridden)}
                    </td>

                    {/* Relevant Master Details */}
                    <td className="py-3 px-3">
                      {master ? (
                        <div className="text-xs space-y-0.5 max-w-[220px]">
                          <div className="text-slate-800 font-medium truncate" title={master.Course}>
                            {master.Course || 'No course assigned'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {master.AcademicBranch || 'N/A'} · {master.IntakeMonth} {master.IntakeYear}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onInspectResult(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Inspect full 30-column Master record and compare details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Record</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No verification results found matching the selected filter or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2">
        <div>
          Showing <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
          <strong className="text-slate-800">{Math.min(currentPage * pageSize, sortedResults.length)}</strong> of{' '}
          <strong className="text-slate-800">{sortedResults.length}</strong> records
          {filteredResults.length !== results.length && ` (filtered from ${results.length} total)`}
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
