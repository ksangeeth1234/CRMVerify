import React from 'react';
import { X, CheckCircle2, AlertTriangle, User, BookOpen, Phone, CreditCard, ShieldCheck } from 'lucide-react';
import { MasterStudent, VerificationResult, VerificationStatus } from '../types';

interface MasterRecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: VerificationResult | null;
  standaloneMasterRecord?: MasterStudent | null;
  onUpdateStatus?: (resultId: string, newStatus: VerificationStatus, selectedRecord?: MasterStudent, notes?: string) => void;
}

export const MasterRecordDetailModal: React.FC<MasterRecordDetailModalProps> = ({
  isOpen,
  onClose,
  result,
  standaloneMasterRecord,
  onUpdateStatus,
}) => {
  if (!isOpen) return null;

  const isStandalone = Boolean(!result && standaloneMasterRecord);
  const master = isStandalone
    ? standaloneMasterRecord
    : (result?.manualSelectedMasterRecord || result?.matchedMasterRecord);

  if (!master && !result) return null;

  const currentStatus = result ? (result.manualOverrideStatus || result.status) : 'Verified in Master';

  const handleSetStatus = (newStatus: VerificationStatus) => {
    if (result && onUpdateStatus) {
      onUpdateStatus(result.id, newStatus, master || undefined, `Status manually set to ${newStatus}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                {isStandalone ? 'Master Database Student Profile' : 'Student Record Verification Details'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">
                {isStandalone
                  ? `Student ID: ${master?.StudentNumber || master?.id || 'N/A'}`
                  : `Row #${result?.rowNumber}`}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {isStandalone
                ? master?.StudentName
                : result?.uploadedStudentName || 'Unnamed Uploaded Student'}
              {!isStandalone && master?.StudentName && master.StudentName !== result?.uploadedStudentName && (
                <span className="text-purple-300 font-normal text-sm ml-2">
                  (Matched Master: {master.StudentName})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-purple-50/70 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-900">Status in Master:</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                currentStatus === 'Verified' || isStandalone
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : currentStatus === 'Possible Match'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : currentStatus === 'Multiple Matches'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : currentStatus === 'Manual Review Required'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isStandalone ? 'Active in Master' : currentStatus}
            </span>

            {!isStandalone && result && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-600">
                  Matching Field: <strong className="text-slate-800">{result.matchingField}</strong>
                </span>
              </>
            )}
          </div>

          {!isStandalone && result && onUpdateStatus && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Actions:</span>
              {currentStatus !== 'Verified' && (
                <button
                  onClick={() => handleSetStatus('Verified')}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Verify
                </button>
              )}
              {currentStatus !== 'Manual Review Required' && (
                <button
                  onClick={() => handleSetStatus('Manual Review Required')}
                  className="px-2.5 py-1 text-xs font-medium bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Flag for Review
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Notes if from verification */}
          {!isStandalone && result && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Verification Engine Notes
              </h4>
              <p className="text-sm text-slate-700">{result.statusReason}</p>
              {result.conflictDetails && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  <strong>Conflict Alert:</strong> {result.conflictDetails}
                </div>
              )}
            </div>
          )}

          {/* Comparison Grid if from verification */}
          {!isStandalone && result && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Source Upload vs Matched Master Values
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Uploaded Values */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 pb-2 border-b border-slate-200">
                    Uploaded File Details
                  </div>
                  <dl className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                    <dt className="text-slate-500">Candidate Name:</dt>
                    <dd className="font-semibold text-slate-800">{result.uploadedStudentName || '—'}</dd>
                    <dt className="text-slate-500">Student / Index No:</dt>
                    <dd className="font-semibold text-slate-800 font-mono">{result.uploadedStudentNumber || '—'}</dd>
                    <dt className="text-slate-500">National ID (NIC):</dt>
                    <dd className="font-semibold text-slate-800 font-mono">{result.uploadedNIC || '—'}</dd>
                    <dt className="text-slate-500">Email Address:</dt>
                    <dd className="font-semibold text-slate-800 truncate" title={result.uploadedEmail}>{result.uploadedEmail || '—'}</dd>
                    <dt className="text-slate-500">Contact Number:</dt>
                    <dd className="font-semibold text-slate-800 font-mono">{result.uploadedMobile || '—'}</dd>
                  </dl>
                </div>

                {/* Matched Master Values */}
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3 pb-2 border-b border-purple-200">
                    Master Record Key Values
                  </div>
                  {master ? (
                    <dl className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                      <dt className="text-purple-700">Student Name:</dt>
                      <dd className="font-semibold text-slate-900">{master.StudentName || '—'}</dd>
                      <dt className="text-purple-700">Student Number:</dt>
                      <dd className="font-semibold text-slate-900 font-mono">{master.StudentNumber || '—'}</dd>
                      <dt className="text-purple-700">NIC:</dt>
                      <dd className="font-semibold text-slate-900 font-mono">{master.nic || '—'}</dd>
                      <dt className="text-purple-700">Email:</dt>
                      <dd className="font-semibold text-slate-900 truncate" title={master.email}>{master.email || '—'}</dd>
                      <dt className="text-purple-700">Mobile:</dt>
                      <dd className="font-semibold text-slate-900 font-mono">{master.mobile || '—'}</dd>
                    </dl>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-4 text-center">
                      No matching Master record found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Full Master Excel Record (All 30 Columns) */}
          {master && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Complete Master Excel Workbook Record (All 30 Preserved Columns)
              </h3>

              <div className="space-y-4">
                {/* 1. Identity & Registration */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    Identity & Student Demographics
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">id</span>
                      <span className="font-mono font-medium text-slate-800">{master.id ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">leadId</span>
                      <span className="font-mono font-medium text-slate-800">{master.leadId ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">StudentNumber</span>
                      <span className="font-mono font-bold text-purple-700">{master.StudentNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">StudentName</span>
                      <span className="font-semibold text-slate-900">{master.StudentName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">nic</span>
                      <span className="font-mono font-medium text-slate-800">{master.nic || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">dob</span>
                      <span className="text-slate-800">{master.dob || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">citizenship</span>
                      <span className="text-slate-800">{master.citizenship || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">RegisteredDate</span>
                      <span className="font-mono text-slate-800">{master.RegisteredDate || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Academic Program & Branch */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    Academic Enrollment & Curriculum
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Course</span>
                      <span className="font-semibold text-slate-900">{master.Course || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">AcademicBranch</span>
                      <span className="text-slate-800">{master.AcademicBranch || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">CounsellorsBranch</span>
                      <span className="text-slate-800">{master.CounsellorsBranch || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Counsellor</span>
                      <span className="text-slate-800">{master.Counsellor || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">batchName</span>
                      <span className="font-medium text-purple-700">{master.batchName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">IntakeMonth / Year</span>
                      <span className="text-slate-800">
                        {master.IntakeMonth || '—'} {master.IntakeYear || ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">mode / courseType</span>
                      <span className="text-slate-800">{master.mode || '—'} / {master.courseType || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">bundleCourseId</span>
                      <span className="font-mono text-slate-800">{master.bundleCourseId || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">qualifications</span>
                      <span className="text-slate-800">{master.qualifications || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Contact & Guardian Information */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    Contact & Guardian Details
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">mobile</span>
                      <span className="font-mono text-slate-800">{master.mobile || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">email</span>
                      <span className="text-slate-800">{master.email || '—'}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block text-[11px]">address</span>
                      <span className="text-slate-800">{master.address || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">parentName</span>
                      <span className="text-slate-800">{master.parentName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">parentMobile</span>
                      <span className="font-mono text-slate-800">{master.parentMobile || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Financial & Status */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    Financial & Administrative Status
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">status</span>
                      <span className="font-semibold text-slate-900">{master.status || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">PaymentPendingStatus</span>
                      <span className="font-medium text-slate-800">{master.PaymentPendingStatus || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">paymentType</span>
                      <span className="text-slate-800">{master.paymentType || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">hasSpecialNeeds</span>
                      <span className="text-slate-800">{String(master.hasSpecialNeeds ?? '—')}</span>
                    </div>
                    {master.specialNeedsReason && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">specialNeedsReason</span>
                        <span className="text-slate-800">{master.specialNeedsReason}</span>
                      </div>
                    )}
                    {master.remark && (
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-slate-400 block text-[11px]">remark</span>
                        <span className="text-slate-800 italic">{master.remark}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Candidates / Similar Matches if from verification */}
          {!isStandalone && result && result.possibleMatches && result.possibleMatches.length > 1 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                All Potential Master Candidates ({result.possibleMatches.length})
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Click any record below to link and verify against that specific Master student record:
              </p>
              <div className="space-y-2">
                {result.possibleMatches.map((cand, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-purple-300 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{cand.record.StudentName}</div>
                      <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">#{cand.record.StudentNumber || cand.record.id}</span>
                        <span>·</span>
                        <span>NIC: {cand.record.nic || 'N/A'}</span>
                        <span>·</span>
                        <span>Course: {cand.record.Course || 'N/A'}</span>
                      </div>
                      <div className="text-purple-700 text-[11px] mt-0.5">{cand.details}</div>
                    </div>
                    {onUpdateStatus && (
                      <button
                        onClick={() => {
                          onUpdateStatus(
                            result.id,
                            'Verified',
                            cand.record,
                            `Manually verified and linked to ${cand.record.StudentName} (#${cand.record.StudentNumber})`
                          );
                        }}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-md text-xs shrink-0 transition-colors cursor-pointer"
                      >
                        Select & Verify
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
