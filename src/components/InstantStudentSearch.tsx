import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  User,
  BookOpen,
  Phone,
  CreditCard,
  Hash,
  Mail,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MasterStudent } from '../types';
import {
  normalizeName,
  normalizeStudentNumber,
  normalizeNIC,
  areNICsMatching,
  normalizeEmail,
  normalizeMobile,
  tokenSortSimilarity,
} from '../utils/normalizer';

interface InstantStudentSearchProps {
  masterRecords: MasterStudent[];
  masterFileName?: string;
  onInspectRecord: (record: MasterStudent) => void;
}

export const InstantStudentSearch: React.FC<InstantStudentSearchProps> = ({
  masterRecords,
  masterFileName,
  onInspectRecord,
}) => {
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'StudentNumber' | 'nic' | 'StudentName' | 'mobile' | 'email'>('all');
  const [hasSearched, setHasSearched] = useState(false);

  // Search execution
  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return { exactMatches: [], fuzzyMatches: [], fieldMatched: '' };
    }

    const normQ = q.toLowerCase();
    const normStdNo = normalizeStudentNumber(q);
    const normNic = normalizeNIC(q);
    const normMail = normalizeEmail(q);
    const normMob = normalizeMobile(q);
    const normNm = normalizeName(q);

    const exactMatches: Array<{ record: MasterStudent; matchedOn: string }> = [];
    const fuzzyMatches: Array<{ record: MasterStudent; score: number }> = [];

    for (const student of masterRecords) {
      let isExact = false;

      // 1. StudentNumber
      if ((searchField === 'all' || searchField === 'StudentNumber') && student.StudentNumber) {
        if (normalizeStudentNumber(student.StudentNumber) === normStdNo && normStdNo.length > 0) {
          exactMatches.push({ record: student, matchedOn: `StudentNumber: ${student.StudentNumber}` });
          isExact = true;
        }
      }

      // 2. NIC
      if (!isExact && (searchField === 'all' || searchField === 'nic') && student.nic) {
        if (areNICsMatching(q, student.nic)) {
          exactMatches.push({ record: student, matchedOn: `NIC: ${student.nic}` });
          isExact = true;
        }
      }

      // 3. Email
      if (!isExact && (searchField === 'all' || searchField === 'email') && student.email) {
        if (normalizeEmail(student.email) === normMail && normMail.length > 0) {
          exactMatches.push({ record: student, matchedOn: `Email: ${student.email}` });
          isExact = true;
        }
      }

      // 4. Mobile
      if (!isExact && (searchField === 'all' || searchField === 'mobile') && student.mobile) {
        if (normalizeMobile(student.mobile) === normMob && normMob.length > 3) {
          exactMatches.push({ record: student, matchedOn: `Mobile: ${student.mobile}` });
          isExact = true;
        }
      }

      // 5. Name Exact
      if (!isExact && (searchField === 'all' || searchField === 'StudentName') && student.StudentName) {
        const studentNormName = normalizeName(student.StudentName);
        if (studentNormName === normNm && normNm.length > 1) {
          exactMatches.push({ record: student, matchedOn: `StudentName (Exact): ${student.StudentName}` });
          isExact = true;
        } else if (studentNormName.includes(normNm) || normNm.includes(studentNormName)) {
          exactMatches.push({ record: student, matchedOn: `StudentName (Contains): ${student.StudentName}` });
          isExact = true;
        } else {
          // Check fuzzy similarity
          const sim = tokenSortSimilarity(q, student.StudentName);
          if (sim >= 0.72) {
            fuzzyMatches.push({ record: student, score: sim });
          }
        }
      }
    }

    fuzzyMatches.sort((a, b) => b.score - a.score);

    return {
      exactMatches,
      fuzzyMatches: exactMatches.length === 0 ? fuzzyMatches : [],
      fieldMatched: exactMatches[0]?.matchedOn || '',
    };
  }, [query, searchField, masterRecords]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setHasSearched(false);
  };

  // Sample quick searches from loaded master
  const sampleQuickSearches = useMemo(() => {
    return masterRecords.slice(0, 3).map((s) => ({
      name: s.StudentName,
      number: s.StudentNumber,
      nic: s.nic,
    }));
  }, [masterRecords]);

  return (
    <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-purple-200 border border-white/20 shadow-xs">
            <Search className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Instant Student Search & Lookup
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Live in Master
              </span>
            </h3>
            <p className="text-xs text-purple-200">
              Directly search and verify whether a student exists in {masterFileName || 'the loaded Master Excel database'} ({masterRecords.length} student records)
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Field Filter Dropdown */}
            <div className="relative shrink-0">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
                className="w-full sm:w-44 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-slate-800 focus:outline-hidden focus:border-purple-600 cursor-pointer"
              >
                <option value="all">Search All Fields</option>
                <option value="StudentNumber">By Student Number</option>
                <option value="nic">By National ID (NIC)</option>
                <option value="StudentName">By Student Name</option>
                <option value="mobile">By Mobile Number</option>
                <option value="email">By Email Address</option>
              </select>
            </div>

            {/* Main Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHasSearched(true);
                }}
                placeholder="Enter Student Number (e.g. STU-2024-001), NIC, Name, Email, or Mobile..."
                className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-purple-600 focus:bg-white transition-all text-slate-900"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <span>Verify Student</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Suggestion Pills */}
          {sampleQuickSearches.length > 0 && !query && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Quick test from your Master:
              </span>
              {sampleQuickSearches.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(s.number || s.name || '');
                    setHasSearched(true);
                  }}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  {s.number || s.name}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Search Results Display Area */}
        {hasSearched && query.trim() && (
          <div className="animate-in fade-in duration-200 space-y-4">
            {/* Case 1: STUDENT FOUND (EXACT MATCH) */}
            {searchResults.exactMatches.length > 0 && (
              <div className="border-2 border-emerald-400 bg-emerald-50/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                          STUDENT FOUND IN MASTER DATABASE
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">
                          {searchResults.exactMatches.length === 1
                            ? '1 Exact Record Matched'
                            : `${searchResults.exactMatches.length} Matching Records Found`}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mt-1">
                        {searchResults.exactMatches[0].record.StudentName}
                        {searchResults.exactMatches[0].record.StudentNumber && (
                          <span className="text-purple-700 font-mono ml-2">
                            (#{searchResults.exactMatches[0].record.StudentNumber})
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Matched on <strong className="text-emerald-800">{searchResults.fieldMatched}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInspectRecord(searchResults.exactMatches[0].record)}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View All 30 Master Fields</span>
                  </button>
                </div>

                {/* Key Student Profile Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-emerald-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Enrolled Course</span>
                    <span className="font-bold text-slate-900 truncate block" title={searchResults.exactMatches[0].record.Course}>
                      {searchResults.exactMatches[0].record.Course || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Academic Branch</span>
                    <span className="font-semibold text-slate-800">
                      {searchResults.exactMatches[0].record.AcademicBranch || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Intake Period</span>
                    <span className="font-semibold text-slate-800">
                      {searchResults.exactMatches[0].record.IntakeMonth} {searchResults.exactMatches[0].record.IntakeYear}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Enrollment Status</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {searchResults.exactMatches[0].record.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">National ID (NIC)</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {searchResults.exactMatches[0].record.nic || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Mobile</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {searchResults.exactMatches[0].record.mobile || '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {searchResults.exactMatches[0].record.email || '—'}
                    </span>
                  </div>
                </div>

                {/* If multiple exact matches exist */}
                {searchResults.exactMatches.length > 1 && (
                  <div className="pt-2 border-t border-emerald-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700">
                      Other matching records in Master:
                    </div>
                    {searchResults.exactMatches.slice(1).map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-slate-900">{m.record.StudentName}</strong>
                          <span className="text-slate-500 font-mono ml-2">#{m.record.StudentNumber || m.record.id}</span>
                          <span className="text-slate-400 mx-2">·</span>
                          <span className="text-slate-600">{m.record.Course}</span>
                        </div>
                        <button
                          onClick={() => onInspectRecord(m.record)}
                          className="text-xs text-purple-700 font-semibold hover:underline"
                        >
                          View Details &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Case 2: SIMILAR / FUZZY MATCHES FOUND */}
            {searchResults.exactMatches.length === 0 && searchResults.fuzzyMatches.length > 0 && (
              <div className="border-2 border-amber-400 bg-amber-50/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <HelpCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                        POSSIBLE MATCH FOUND (SPELLING VARIATION)
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      No exact match for "{query}", but found {searchResults.fuzzyMatches.length} student(s) with similar names:
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Review the candidate records below to confirm if one corresponds to this student.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {searchResults.fuzzyMatches.slice(0, 4).map((fuzz, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-xs hover:border-amber-400 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{fuzz.record.StudentName}</span>
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                            {Math.round(fuzz.score * 100)}% match
                          </span>
                        </div>
                        <div className="text-slate-500 text-xs mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>Student #: <strong className="font-mono text-slate-800">{fuzz.record.StudentNumber || 'N/A'}</strong></span>
                          <span>·</span>
                          <span>NIC: <strong className="font-mono text-slate-800">{fuzz.record.nic || 'N/A'}</strong></span>
                          <span>·</span>
                          <span>Course: <strong className="text-slate-800">{fuzz.record.Course || 'N/A'}</strong></span>
                          <span>·</span>
                          <span>Batch: <strong className="text-slate-800">{fuzz.record.batchName || 'N/A'}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => onInspectRecord(fuzz.record)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        Inspect Record
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case 3: STUDENT NOT FOUND */}
            {searchResults.exactMatches.length === 0 && searchResults.fuzzyMatches.length === 0 && (
              <div className="border-2 border-rose-300 bg-rose-50/50 rounded-2xl p-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full">
                    STUDENT NOT FOUND
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 mt-2">
                    No student matching "{query}" exists in the Master database.
                  </h4>
                  <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1">
                    Searched across all <strong>{masterRecords.length} records</strong> in "{masterFileName}". Checked StudentNumber, NIC, StudentName, Mobile, and Email without any match.
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
