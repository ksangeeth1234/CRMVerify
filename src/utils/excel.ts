import * as XLSX from 'xlsx';
import { ColumnMapping, MasterStudent, VerificationResult } from '../types';

export interface ParsedWorkbook {
  sheetNames: string[];
  sheetsData: Record<string, any[]>;
  sheetsHeaders: Record<string, string[]>;
}

/**
 * Reads an Excel file buffer and parses all sheets into JSON structures
 */
export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    dateNF: 'yyyy-mm-dd',
    raw: false,
  });

  const sheetNames = workbook.SheetNames;
  const sheetsData: Record<string, any[]> = {};
  const sheetsHeaders: Record<string, string[]> = {};

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Convert to JSON with empty string defaults
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
      blankrows: false,
      raw: false,
    });

    // Extract headers safely from worksheet range
    let headers: string[] = [];
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
        if (cell && cell.v !== undefined && cell.v !== null) {
          headers.push(String(cell.v).trim());
        }
      }
    }

    // Fallback if headers from range empty
    if (headers.length === 0 && rawData.length > 0) {
      headers = Object.keys(rawData[0]);
    }

    sheetsData[sheetName] = rawData;
    sheetsHeaders[sheetName] = headers;
  }

  return {
    sheetNames,
    sheetsData,
    sheetsHeaders,
  };
}

/**
 * Intelligently auto-detect column mappings in the uploaded student verification file
 */
export function autoDetectColumnMappings(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    studentNumber: '',
    nic: '',
    email: '',
    mobile: '',
    studentName: '',
  };

  const cleanHeaders = headers.map((h) => ({
    original: h,
    normalized: h.toLowerCase().replace(/[^a-z0-9]/g, ''),
  }));

  for (const h of cleanHeaders) {
    const norm = h.normalized;

    // Student Number aliases
    if (!mapping.studentNumber) {
      if (
        norm === 'studentnumber' ||
        norm === 'studentno' ||
        norm === 'stdno' ||
        norm === 'regno' ||
        norm === 'registrationnumber' ||
        norm === 'studentid' ||
        norm === 'stdid' ||
        norm === 'indexno' ||
        norm === 'admissionno' ||
        norm === 'fileno' ||
        norm === 'studentcode' ||
        norm === 'idno'
      ) {
        mapping.studentNumber = h.original;
        continue;
      }
    }

    // NIC aliases
    if (!mapping.nic) {
      if (
        norm === 'nic' ||
        norm === 'nicno' ||
        norm === 'nationalid' ||
        norm === 'nationalidcard' ||
        norm === 'identityno' ||
        norm === 'identitycard' ||
        norm === 'citizenshipid' ||
        norm === 'idcard' ||
        norm === 'passport' ||
        norm === 'passportno'
      ) {
        mapping.nic = h.original;
        continue;
      }
    }

    // Email aliases
    if (!mapping.email) {
      if (
        norm === 'email' ||
        norm === 'emailaddress' ||
        norm === 'mail' ||
        norm === 'e_mail' ||
        norm === 'useremail' ||
        norm === 'studentemail'
      ) {
        mapping.email = h.original;
        continue;
      }
    }

    // Mobile aliases
    if (!mapping.mobile) {
      if (
        norm === 'mobile' ||
        norm === 'phone' ||
        norm === 'phonenumber' ||
        norm === 'mobileno' ||
        norm === 'contact' ||
        norm === 'contactno' ||
        norm === 'telephone' ||
        norm === 'tel' ||
        norm === 'cell' ||
        norm === 'whatsapp' ||
        norm === 'mobilephone'
      ) {
        mapping.mobile = h.original;
        continue;
      }
    }

    // Student Name aliases
    if (!mapping.studentName) {
      if (
        norm === 'studentname' ||
        norm === 'name' ||
        norm === 'fullname' ||
        norm === 'applicantname' ||
        norm === 'candidatename' ||
        norm === 'student' ||
        norm === 'nameofstudent' ||
        norm === 'personname'
      ) {
        mapping.studentName = h.original;
        continue;
      }
    }
  }

  return mapping;
}

/**
 * Builds rows for export preserving all original uploaded columns and appending verified Master attributes
 */
export function buildExportRows(
  results: VerificationResult[],
  filterStatus?: string
): Record<string, any>[] {
  const filtered = filterStatus && filterStatus !== 'All'
    ? results.filter((r) => (r.manualOverrideStatus || r.status) === filterStatus)
    : results;

  return filtered.map((item) => {
    const finalStatus = item.manualOverrideStatus || item.status;
    const finalMaster = item.manualSelectedMasterRecord || item.matchedMasterRecord;

    const row: Record<string, any> = {
      'Row_Number': item.rowNumber,
      'Verification_Status': finalStatus,
      'Matching_Field': item.matchingField,
      'Status_Details': item.statusReason,
    };

    // Include all original uploaded columns
    if (item.uploadedRow) {
      Object.entries(item.uploadedRow).forEach(([key, val]) => {
        row[`Uploaded_${key}`] = val !== undefined && val !== null ? val : '';
      });
    }

    // Include matched Master columns
    row['Master_StudentNumber'] = finalMaster?.StudentNumber || '';
    row['Master_StudentName'] = finalMaster?.StudentName || '';
    row['Master_Course'] = finalMaster?.Course || '';
    row['Master_AcademicBranch'] = finalMaster?.AcademicBranch || '';
    row['Master_IntakeMonth'] = finalMaster?.IntakeMonth || '';
    row['Master_IntakeYear'] = finalMaster?.IntakeYear || '';
    row['Master_Status'] = finalMaster?.status || '';
    row['Master_NIC'] = finalMaster?.nic || '';
    row['Master_Email'] = finalMaster?.email || '';
    row['Master_Mobile'] = finalMaster?.mobile || '';
    row['Master_Counsellor'] = finalMaster?.Counsellor || '';
    row['Master_CounsellorsBranch'] = finalMaster?.CounsellorsBranch || '';
    row['Master_BatchName'] = finalMaster?.batchName || '';
    row['Master_PaymentPendingStatus'] = finalMaster?.PaymentPendingStatus || '';
    row['Master_RegisteredDate'] = finalMaster?.RegisteredDate || '';
    row['Master_Remark'] = finalMaster?.remark || '';

    // If manual review notes exist
    if (item.manualReviewNotes) {
      row['Manual_Review_Notes'] = item.manualReviewNotes;
    }
    if (item.conflictDetails) {
      row['Conflict_Details'] = item.conflictDetails;
    }

    return row;
  });
}

/**
 * Exports data to an Excel (.xlsx) file
 */
export function exportToExcel(
  results: VerificationResult[],
  filename: string,
  filterStatus?: string
) {
  const rows = buildExportRows(results, filterStatus);
  if (rows.length === 0) {
    throw new Error('No records available for export with selected filter.');
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths roughly
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxValLen = Math.max(
      key.length,
      ...rows.slice(0, 100).map((r) => String(r[key] || '').length)
    );
    return { wch: Math.min(Math.max(maxValLen + 2, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Verification Results');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exports data to a CSV (.csv) file
 */
export function exportToCSV(
  results: VerificationResult[],
  filename: string,
  filterStatus?: string
) {
  const rows = buildExportRows(results, filterStatus);
  if (rows.length === 0) {
    throw new Error('No records available for export with selected filter.');
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Download via Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
