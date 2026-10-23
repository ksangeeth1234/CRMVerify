export const MASTER_COLUMNS = [
  'id',
  'leadId',
  'Counsellor',
  'StudentNumber',
  'RegisteredDate',
  'IntakeMonth',
  'IntakeYear',
  'StudentName',
  'CounsellorsBranch',
  'AcademicBranch',
  'Course',
  'PaymentPendingStatus',
  'status',
  'mode',
  'courseType',
  'mobile',
  'email',
  'batchName',
  'address',
  'nic',
  'dob',
  'citizenship',
  'hasSpecialNeeds',
  'specialNeedsReason',
  'remark',
  'parentName',
  'parentMobile',
  'qualifications',
  'bundleCourseId',
  'paymentType',
] as const;

export type MasterColumn = (typeof MASTER_COLUMNS)[number];

export interface MasterStudent {
  _rowIndex: number;
  id?: string | number;
  leadId?: string | number;
  Counsellor?: string;
  StudentNumber?: string;
  RegisteredDate?: string;
  IntakeMonth?: string;
  IntakeYear?: string | number;
  StudentName?: string;
  CounsellorsBranch?: string;
  AcademicBranch?: string;
  Course?: string;
  PaymentPendingStatus?: string;
  status?: string;
  mode?: string;
  courseType?: string;
  mobile?: string;
  email?: string;
  batchName?: string;
  address?: string;
  nic?: string;
  dob?: string;
  citizenship?: string;
  hasSpecialNeeds?: string | boolean;
  specialNeedsReason?: string;
  remark?: string;
  parentName?: string;
  parentMobile?: string;
  qualifications?: string;
  bundleCourseId?: string | number;
  paymentType?: string;
  [key: string]: any;
}

export interface ColumnMapping {
  studentNumber: string;
  nic: string;
  email: string;
  mobile: string;
  studentName: string;
}

export interface SearchFieldConfig {
  checkStudentNumber: boolean;
  checkNIC: boolean;
  checkEmail: boolean;
  checkMobile: boolean;
  checkStudentName: boolean;
  fuzzyNameMatching: boolean;
  fuzzyThreshold: number; // 0.65 to 0.95, default 0.82
}

export type VerificationStatus =
  | 'Verified'
  | 'Possible Match'
  | 'Multiple Matches'
  | 'Manual Review Required'
  | 'Not Found'
  | 'Insufficient Info';

export interface MatchCandidate {
  record: MasterStudent;
  matchedField: 'StudentNumber' | 'nic' | 'email' | 'mobile' | 'StudentName';
  matchType: 'exact' | 'fuzzy' | 'normalized';
  score: number; // 0 to 1
  details: string;
}

export interface VerificationResult {
  id: string;
  rowNumber: number;
  uploadedRow: Record<string, any>;
  uploadedStudentName: string;
  uploadedStudentNumber: string;
  uploadedNIC: string;
  uploadedEmail: string;
  uploadedMobile: string;
  status: VerificationStatus;
  statusReason: string;
  matchingField: string;
  matchedMasterRecord: MasterStudent | null;
  possibleMatches: MatchCandidate[];
  conflictDetails: string | null;
  manualOverrideStatus?: VerificationStatus;
  manualReviewNotes?: string;
  manualSelectedMasterRecord?: MasterStudent | null;
  reviewedAt?: string;
}

export interface LoadedFileInfo {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  loadedAt: string;
}
