import React, { useState } from 'react';
import { Header } from './components/Header';
import { MasterUploadSection } from './components/MasterUploadSection';
import { InstantStudentSearch } from './components/InstantStudentSearch';
import { VerificationUploadSection } from './components/VerificationUploadSection';
import { ResultsDashboard } from './components/ResultsDashboard';
import { MasterRecordDetailModal } from './components/MasterRecordDetailModal';
import { ConfirmReplaceModal } from './components/ConfirmReplaceModal';
import { VerificationProgressBar } from './components/VerificationProgressBar';
import { Footer } from './components/Footer';
import {
  MasterStudent,
  LoadedFileInfo,
  ColumnMapping,
  SearchFieldConfig,
  VerificationResult,
  VerificationStatus,
} from './types';
import { parseExcelFile, autoDetectColumnMappings } from './utils/excel';
import { verifyStudent } from './utils/verifier';
import { SAMPLE_MASTER_STUDENTS, SAMPLE_VERIFICATION_ROWS } from './data/sampleData';
import { Search, FileSpreadsheet, ArrowRight } from 'lucide-react';

export default function App() {
  // Master Database State
  const [masterInfo, setMasterInfo] = useState<LoadedFileInfo | null>(null);
  const [masterRecords, setMasterRecords] = useState<MasterStudent[]>([]);
  const [rawMasterSheets, setRawMasterSheets] = useState<Record<string, any[]>>({});

  // Active Verification Workflow Tab
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'instant-search' | 'batch-verify'>('instant-search');

  // Verification File State
  const [verificationInfo, setVerificationInfo] = useState<LoadedFileInfo | null>(null);
  const [rawVerificationSheets, setRawVerificationSheets] = useState<Record<string, any[]>>({});
  const [uploadedVerificationRows, setUploadedVerificationRows] = useState<Record<string, any>[]>([]);

  // Mapping & Search Priority Config
  const [mapping, setMapping] = useState<ColumnMapping>({
    studentNumber: '',
    nic: '',
    email: '',
    mobile: '',
    studentName: '',
  });

  const [config, setConfig] = useState<SearchFieldConfig>({
    checkStudentNumber: true,
    checkNIC: true,
    checkEmail: true,
    checkMobile: true,
    checkStudentName: true,
    fuzzyNameMatching: true,
    fuzzyThreshold: 0.8,
  });

  // Verification Process State
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationProgress, setVerificationProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  }>({ current: 0, total: 0, currentName: '' });

  // Modals
  const [inspectingResult, setInspectingResult] = useState<VerificationResult | null>(null);
  const [inspectingMasterRecord, setInspectingMasterRecord] = useState<MasterStudent | null>(null);
  const [replacingMasterFile, setReplacingMasterFile] = useState<File | null>(null);

  // Parse Master Excel File
  const handleUploadMasterFile = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.sheetNames.length === 0) {
        alert('The uploaded Excel workbook contains no readable sheets.');
        return;
      }

      const defaultSheet = parsed.sheetNames[0];
      const initialRows = parsed.sheetsData[defaultSheet] || [];
      const initialHeaders = parsed.sheetsHeaders[defaultSheet] || [];

      // Assign _rowIndex to each master student record
      const formattedMaster: MasterStudent[] = initialRows.map((row, idx) => ({
        ...row,
        _rowIndex: idx + 1,
      }));

      setRawMasterSheets(parsed.sheetsData);
      setMasterRecords(formattedMaster);
      setMasterInfo({
        fileName: file.name,
        fileSize: file.size,
        sheetNames: parsed.sheetNames,
        selectedSheet: defaultSheet,
        rowCount: formattedMaster.length,
        columnCount: initialHeaders.length,
        columns: initialHeaders,
        loadedAt: new Date().toISOString(),
      });

      // Default to instant search tab so user can immediately look up students
      setActiveWorkflowTab('instant-search');

      // Clear previous verification batch results
      if (results.length > 0) {
        setResults([]);
      }
    } catch (err: any) {
      console.error('Failed to read Master Excel:', err);
      alert(`Error reading Excel file: ${err.message || 'Unknown error'}`);
    }
  };

  // Change worksheet for Master Excel
  const handleSelectMasterSheet = (sheetName: string) => {
    if (!masterInfo || !rawMasterSheets[sheetName]) return;
    const sheetRows = rawMasterSheets[sheetName];
    const formattedMaster: MasterStudent[] = sheetRows.map((row, idx) => ({
      ...row,
      _rowIndex: idx + 1,
    }));
    const headers = sheetRows.length > 0 ? Object.keys(sheetRows[0]) : [];

    setMasterRecords(formattedMaster);
    setMasterInfo((prev) =>
      prev
        ? {
            ...prev,
            selectedSheet: sheetName,
            rowCount: formattedMaster.length,
            columnCount: headers.length,
            columns: headers,
          }
        : null
    );
    if (results.length > 0) {
      setResults([]);
    }
  };

  // Parse Verification Excel File
  const handleUploadVerificationFile = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.sheetNames.length === 0) {
        alert('The uploaded Excel workbook contains no readable sheets.');
        return;
      }

      const defaultSheet = parsed.sheetNames[0];
      const initialRows = parsed.sheetsData[defaultSheet] || [];
      const initialHeaders = parsed.sheetsHeaders[defaultSheet] || [];

      setRawVerificationSheets(parsed.sheetsData);
      setUploadedVerificationRows(initialRows);

      // Auto-detect column mappings
      const detectedMappings = autoDetectColumnMappings(initialHeaders);
      setMapping(detectedMappings);

      setVerificationInfo({
        fileName: file.name,
        fileSize: file.size,
        sheetNames: parsed.sheetNames,
        selectedSheet: defaultSheet,
        rowCount: initialRows.length,
        columnCount: initialHeaders.length,
        columns: initialHeaders,
        loadedAt: new Date().toISOString(),
      });

      // Switch to batch verify view
      setActiveWorkflowTab('batch-verify');
      setResults([]);
    } catch (err: any) {
      console.error('Failed to read Verification Excel:', err);
      alert(`Error reading Excel file: ${err.message || 'Unknown error'}`);
    }
  };

  // Change worksheet for Verification Excel
  const handleSelectVerificationSheet = (sheetName: string) => {
    if (!verificationInfo || !rawVerificationSheets[sheetName]) return;
    const sheetRows = rawVerificationSheets[sheetName];
    const headers = sheetRows.length > 0 ? Object.keys(sheetRows[0]) : [];

    setUploadedVerificationRows(sheetRows);
    const detectedMappings = autoDetectColumnMappings(headers);
    setMapping(detectedMappings);

    setVerificationInfo((prev) =>
      prev
        ? {
            ...prev,
            selectedSheet: sheetName,
            rowCount: sheetRows.length,
            columnCount: headers.length,
            columns: headers,
          }
        : null
    );
    setResults([]);
  };

  // Run Student Verification with visual progress
  const handleStartVerification = async () => {
    if (!masterRecords.length || !uploadedVerificationRows.length) return;

    setIsVerifying(true);
    const total = uploadedVerificationRows.length;
    setVerificationProgress({ current: 0, total, currentName: '' });

    const newResults: VerificationResult[] = [];
    const chunkSize = 25; // Chunk size to allow smooth progress animations
    let processed = 0;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = uploadedVerificationRows.slice(i, i + chunkSize);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNumber = i + j + 1;
        const res = verifyStudent(rowNumber, row, masterRecords, mapping, config);
        newResults.push(res);
      }

      processed = Math.min(i + chunkSize, total);
      const currentStudentName = mapping.studentName ? chunk[chunk.length - 1][mapping.studentName] : '';
      setVerificationProgress({
        current: processed,
        total,
        currentName: currentStudentName || `Row #${processed}`,
      });

      // Small tick to let React render progress bar
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    setResults(newResults);
    setIsVerifying(false);
  };

  // 1-Click Load Realistic Demo Sample Data
  const handleLoadSampleDemoData = () => {
    // 1. Populate Master with SAMPLE_MASTER_STUDENTS
    const masterHeaders = Object.keys(SAMPLE_MASTER_STUDENTS[0]).filter((k) => k !== '_rowIndex');
    setRawMasterSheets({ 'Master Student Database': SAMPLE_MASTER_STUDENTS });
    setMasterRecords(SAMPLE_MASTER_STUDENTS);
    setMasterInfo({
      fileName: 'Master_Student_Database_Sample.xlsx',
      fileSize: 45200,
      sheetNames: ['Master Student Database', 'Archived Records'],
      selectedSheet: 'Master Student Database',
      rowCount: SAMPLE_MASTER_STUDENTS.length,
      columnCount: masterHeaders.length,
      columns: masterHeaders,
      loadedAt: new Date().toISOString(),
    });

    // 2. Populate Verification with SAMPLE_VERIFICATION_ROWS
    const verHeaders = Object.keys(SAMPLE_VERIFICATION_ROWS[0]);
    setRawVerificationSheets({ 'Candidates for Verification': SAMPLE_VERIFICATION_ROWS });
    setUploadedVerificationRows(SAMPLE_VERIFICATION_ROWS);
    setVerificationInfo({
      fileName: 'Students_To_Verify_Sample.xlsx',
      fileSize: 22400,
      sheetNames: ['Candidates for Verification'],
      selectedSheet: 'Candidates for Verification',
      rowCount: SAMPLE_VERIFICATION_ROWS.length,
      columnCount: verHeaders.length,
      columns: verHeaders,
      loadedAt: new Date().toISOString(),
    });

    // 3. Auto map columns
    const autoMaps = autoDetectColumnMappings(verHeaders);
    setMapping(autoMaps);

    // 4. Automatically run verification
    const initialRes = SAMPLE_VERIFICATION_ROWS.map((row, idx) =>
      verifyStudent(idx + 1, row, SAMPLE_MASTER_STUDENTS, autoMaps, config)
    );
    setResults(initialRes);
    setActiveWorkflowTab('batch-verify');
  };

  // Reset entire workspace
  const handleResetAll = () => {
    if (confirm('Reset the workspace? This will clear all uploaded workbooks and verification results.')) {
      setMasterInfo(null);
      setMasterRecords([]);
      setRawMasterSheets({});
      setVerificationInfo(null);
      setRawVerificationSheets({});
      setUploadedVerificationRows([]);
      setResults([]);
    }
  };

  // Update Result Status Manually
  const handleUpdateStatus = (
    resultId: string,
    newStatus: VerificationStatus,
    selectedRecord?: MasterStudent,
    notes?: string
  ) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.id === resultId) {
          return {
            ...r,
            manualOverrideStatus: newStatus,
            manualSelectedMasterRecord: selectedRecord || r.manualSelectedMasterRecord || r.matchedMasterRecord,
            manualReviewNotes: notes || `Manually updated to ${newStatus}`,
            reviewedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // If modal is inspecting this result, update inspection state
    if (inspectingResult && inspectingResult.id === resultId) {
      setInspectingResult((prev) =>
        prev
          ? {
              ...prev,
              manualOverrideStatus: newStatus,
              manualSelectedMasterRecord: selectedRecord || prev.manualSelectedMasterRecord || prev.matchedMasterRecord,
              manualReviewNotes: notes || `Manually updated to ${newStatus}`,
              reviewedAt: new Date().toISOString(),
            }
          : null
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <Header
        masterCount={masterRecords.length}
        masterFileName={masterInfo?.fileName}
        hasVerificationData={Boolean(verificationInfo || results.length > 0)}
        onLoadSampleData={handleLoadSampleDemoData}
        onResetAll={handleResetAll}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 1: Master Student Database */}
        <MasterUploadSection
          masterInfo={masterInfo}
          masterRecords={masterRecords}
          rawSheetsData={rawMasterSheets}
          onFileUpload={handleUploadMasterFile}
          onSelectSheet={handleSelectMasterSheet}
          onRequestReplace={(file) => setReplacingMasterFile(file)}
          onInspectRecord={(record) => {
            setInspectingResult(null);
            setInspectingMasterRecord(record);
          }}
          isLoading={false}
        />

        {/* Workflow Navigation: Only when Master is loaded */}
        {masterRecords.length > 0 && (
          <div className="space-y-6">
            {/* Segmented Mode Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowTab('instant-search')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeWorkflowTab === 'instant-search'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>1. Instant Student Lookup & Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveWorkflowTab('batch-verify')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeWorkflowTab === 'batch-verify'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>2. Batch Excel File Verification</span>
                  {verificationInfo && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-900">
                      {verificationInfo.rowCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-500 hidden sm:block px-3">
                {activeWorkflowTab === 'instant-search'
                  ? '🔍 Type any student name, ID, or NIC to check if they exist in Master'
                  : '📊 Upload a second workbook to cross-match and verify a full batch'}
              </div>
            </div>

            {/* View 1: Instant Student Lookup */}
            {activeWorkflowTab === 'instant-search' && (
              <InstantStudentSearch
                masterRecords={masterRecords}
                masterFileName={masterInfo?.fileName}
                onInspectRecord={(record) => {
                  setInspectingResult(null);
                  setInspectingMasterRecord(record);
                }}
              />
            )}

            {/* View 2: Batch Verification Upload & Dashboard */}
            {activeWorkflowTab === 'batch-verify' && (
              <div className="space-y-8 animate-in fade-in duration-150">
                <VerificationUploadSection
                  verificationInfo={verificationInfo}
                  uploadedRows={uploadedVerificationRows}
                  mapping={mapping}
                  onUpdateMapping={(key, value) => setMapping((prev) => ({ ...prev, [key]: value }))}
                  config={config}
                  onUpdateConfig={setConfig}
                  onFileUpload={handleUploadVerificationFile}
                  onSelectSheet={handleSelectVerificationSheet}
                  onStartVerification={handleStartVerification}
                  isMasterLoaded={masterRecords.length > 0}
                  isVerifying={isVerifying}
                />

                {/* Live Progress Bar during active processing */}
                {isVerifying && (
                  <VerificationProgressBar
                    current={verificationProgress.current}
                    total={verificationProgress.total}
                    currentName={verificationProgress.currentName}
                  />
                )}

                {/* Verification Results Dashboard */}
                {results.length > 0 && (
                  <ResultsDashboard
                    results={results}
                    onInspectResult={(item) => {
                      setInspectingMasterRecord(null);
                      setInspectingResult(item);
                    }}
                    onUpdateStatus={handleUpdateStatus}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Full 30-Column Master Record & Conflict Resolution Modal */}
      <MasterRecordDetailModal
        isOpen={Boolean(inspectingResult || inspectingMasterRecord)}
        onClose={() => {
          setInspectingResult(null);
          setInspectingMasterRecord(null);
        }}
        result={inspectingResult}
        standaloneMasterRecord={inspectingMasterRecord}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Master Replace Confirmation Dialog */}
      <ConfirmReplaceModal
        isOpen={Boolean(replacingMasterFile)}
        onClose={() => setReplacingMasterFile(null)}
        onConfirm={() => {
          if (replacingMasterFile) {
            handleUploadMasterFile(replacingMasterFile);
            setReplacingMasterFile(null);
          }
        }}
        currentFileName={masterInfo?.fileName || 'Current Master Database'}
        newFileName={replacingMasterFile?.name || 'New Master Workbook'}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
