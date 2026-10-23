import {
  MasterStudent,
  ColumnMapping,
  SearchFieldConfig,
  VerificationResult,
  VerificationStatus,
  MatchCandidate,
} from '../types';
import {
  normalizeName,
  normalizeStudentNumber,
  normalizeNIC,
  areNICsMatching,
  normalizeEmail,
  normalizeMobile,
  tokenSortSimilarity,
  cleanString,
} from './normalizer';

export function verifyStudent(
  rowNumber: number,
  uploadedRow: Record<string, any>,
  masterRecords: MasterStudent[],
  mapping: ColumnMapping,
  config: SearchFieldConfig
): VerificationResult {
  const rawStudentNumber = mapping.studentNumber ? cleanString(uploadedRow[mapping.studentNumber]) : '';
  const rawNIC = mapping.nic ? cleanString(uploadedRow[mapping.nic]) : '';
  const rawEmail = mapping.email ? cleanString(uploadedRow[mapping.email]) : '';
  const rawMobile = mapping.mobile ? cleanString(uploadedRow[mapping.mobile]) : '';
  const rawStudentName = mapping.studentName ? cleanString(uploadedRow[mapping.studentName]) : '';

  const normStudentNumber = normalizeStudentNumber(rawStudentNumber);
  const normNIC = normalizeNIC(rawNIC);
  const normEmail = normalizeEmail(rawEmail);
  const normMobile = normalizeMobile(rawMobile);
  const normStudentName = normalizeName(rawStudentName);

  // Check if any searchable data is provided
  const hasStudentNumber = Boolean(config.checkStudentNumber && normStudentNumber);
  const hasNIC = Boolean(config.checkNIC && normNIC);
  const hasEmail = Boolean(config.checkEmail && normEmail);
  const hasMobile = Boolean(config.checkMobile && normMobile);
  const hasStudentName = Boolean(config.checkStudentName && normStudentName);

  const baseResult: Omit<VerificationResult, 'status' | 'statusReason' | 'matchingField' | 'matchedMasterRecord' | 'possibleMatches' | 'conflictDetails'> = {
    id: `row-${rowNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    rowNumber,
    uploadedRow,
    uploadedStudentName: rawStudentName,
    uploadedStudentNumber: rawStudentNumber,
    uploadedNIC: rawNIC,
    uploadedEmail: rawEmail,
    uploadedMobile: rawMobile,
  };

  if (!hasStudentNumber && !hasNIC && !hasEmail && !hasMobile && !hasStudentName) {
    return {
      ...baseResult,
      status: 'Insufficient Info',
      statusReason: 'No enabled search fields with valid values were found in this row.',
      matchingField: 'None',
      matchedMasterRecord: null,
      possibleMatches: [],
      conflictDetails: null,
    };
  }

  // Find matches by each active criterion across master records
  const studentNumberMatches: MasterStudent[] = [];
  const nicMatches: MasterStudent[] = [];
  const emailMatches: MasterStudent[] = [];
  const mobileMatches: MasterStudent[] = [];
  const exactNameMatches: MasterStudent[] = [];
  const fuzzyNameCandidates: Array<{ record: MasterStudent; score: number }> = [];

  for (const master of masterRecords) {
    // 1. StudentNumber match
    if (hasStudentNumber && master.StudentNumber) {
      if (normalizeStudentNumber(master.StudentNumber) === normStudentNumber) {
        studentNumberMatches.push(master);
      }
    }

    // 2. NIC match
    if (hasNIC && master.nic) {
      if (areNICsMatching(rawNIC, master.nic)) {
        nicMatches.push(master);
      }
    }

    // 3. Email match
    if (hasEmail && master.email) {
      if (normalizeEmail(master.email) === normEmail) {
        emailMatches.push(master);
      }
    }

    // 4. Mobile match
    if (hasMobile && master.mobile) {
      if (normalizeMobile(master.mobile) === normMobile) {
        mobileMatches.push(master);
      }
    }

    // 5. Student Name match
    if (hasStudentName && master.StudentName) {
      const masterNormName = normalizeName(master.StudentName);
      if (masterNormName === normStudentName) {
        exactNameMatches.push(master);
      } else if (config.fuzzyNameMatching) {
        const sim = tokenSortSimilarity(rawStudentName, master.StudentName);
        if (sim >= config.fuzzyThreshold) {
          fuzzyNameCandidates.push({ record: master, score: sim });
        }
      }
    }
  }

  // Conflict Checking between reliable unique identifiers (StudentNumber, NIC, Email, Mobile)
  // If StudentNumber points to Record A, but NIC points to Record B, that's a conflict!
  const matchedRecordsMap = new Map<string, { field: string; record: MasterStudent }>();

  if (studentNumberMatches.length > 0) {
    studentNumberMatches.forEach((m) =>
      matchedRecordsMap.set(`id-${m.id || m.StudentNumber || m._rowIndex}`, { field: 'StudentNumber', record: m })
    );
  }
  if (nicMatches.length > 0) {
    nicMatches.forEach((m) =>
      matchedRecordsMap.set(`id-${m.id || m.StudentNumber || m._rowIndex}`, { field: 'NIC', record: m })
    );
  }
  if (emailMatches.length > 0) {
    emailMatches.forEach((m) =>
      matchedRecordsMap.set(`id-${m.id || m.StudentNumber || m._rowIndex}`, { field: 'Email', record: m })
    );
  }
  if (mobileMatches.length > 0) {
    mobileMatches.forEach((m) =>
      matchedRecordsMap.set(`id-${m.id || m.StudentNumber || m._rowIndex}`, { field: 'Mobile', record: m })
    );
  }

  // Check if multiple DISTINCT master records were matched by different reliable identifiers
  const distinctMasterIds = new Set<any>();
  studentNumberMatches.forEach((m) => distinctMasterIds.add(m.id ?? m.StudentNumber ?? m._rowIndex));
  nicMatches.forEach((m) => distinctMasterIds.add(m.id ?? m.StudentNumber ?? m._rowIndex));
  emailMatches.forEach((m) => distinctMasterIds.add(m.id ?? m.StudentNumber ?? m._rowIndex));

  if (distinctMasterIds.size > 1 && (studentNumberMatches.length > 0 || nicMatches.length > 0 || emailMatches.length > 0)) {
    // Conflict between high-priority identifiers!
    const conflictReasons: string[] = [];
    if (studentNumberMatches.length > 0) {
      conflictReasons.push(`StudentNumber (${rawStudentNumber}) matches "${studentNumberMatches[0].StudentName}" (#${studentNumberMatches[0].StudentNumber || studentNumberMatches[0].id})`);
    }
    if (nicMatches.length > 0) {
      conflictReasons.push(`NIC (${rawNIC}) matches "${nicMatches[0].StudentName}" (#${nicMatches[0].StudentNumber || nicMatches[0].id})`);
    }
    if (emailMatches.length > 0) {
      conflictReasons.push(`Email (${rawEmail}) matches "${emailMatches[0].StudentName}" (#${emailMatches[0].StudentNumber || emailMatches[0].id})`);
    }

    const allConflictingRecords = Array.from(
      new Map(
        [...studentNumberMatches, ...nicMatches, ...emailMatches, ...mobileMatches].map((r) => [
          r.id ?? r.StudentNumber ?? r._rowIndex,
          r,
        ])
      ).values()
    );

    return {
      ...baseResult,
      status: 'Manual Review Required',
      statusReason: `Conflicting identifiers found across distinct master student records. ${conflictReasons.join('; ')}.`,
      matchingField: 'Conflicting Fields (StudentNumber / NIC / Email)',
      matchedMasterRecord: studentNumberMatches[0] || nicMatches[0] || null,
      possibleMatches: allConflictingRecords.map((rec) => ({
        record: rec,
        matchedField: 'StudentNumber',
        matchType: 'exact',
        score: 1.0,
        details: `Candidate matched on ${rec.StudentNumber === rawStudentNumber ? 'StudentNumber' : rec.nic === rawNIC ? 'NIC' : 'Identifier'}`,
      })),
      conflictDetails: conflictReasons.join(' | '),
    };
  }

  // Evaluate by Search Priority:
  // Priority 1: StudentNumber
  if (hasStudentNumber) {
    if (studentNumberMatches.length === 1) {
      return {
        ...baseResult,
        status: 'Verified',
        statusReason: `Exact match found by StudentNumber "${studentNumberMatches[0].StudentNumber}".`,
        matchingField: 'StudentNumber (Exact)',
        matchedMasterRecord: studentNumberMatches[0],
        possibleMatches: [{
          record: studentNumberMatches[0],
          matchedField: 'StudentNumber',
          matchType: 'exact',
          score: 1.0,
          details: `StudentNumber: ${studentNumberMatches[0].StudentNumber}`,
        }],
        conflictDetails: null,
      };
    } else if (studentNumberMatches.length > 1) {
      return {
        ...baseResult,
        status: 'Multiple Matches',
        statusReason: `Found ${studentNumberMatches.length} master records with identical StudentNumber "${rawStudentNumber}".`,
        matchingField: 'StudentNumber (Multiple)',
        matchedMasterRecord: null,
        possibleMatches: studentNumberMatches.map((rec) => ({
          record: rec,
          matchedField: 'StudentNumber',
          matchType: 'exact',
          score: 1.0,
          details: `Duplicate StudentNumber in Master: ${rec.StudentName} (${rec.Course || 'N/A'})`,
        })),
        conflictDetails: `Multiple records in Master database share StudentNumber "${rawStudentNumber}".`,
      };
    }
  }

  // Priority 2: NIC
  if (hasNIC) {
    if (nicMatches.length === 1) {
      return {
        ...baseResult,
        status: 'Verified',
        statusReason: `Exact match found by National ID (NIC) "${nicMatches[0].nic}".`,
        matchingField: 'NIC (Exact)',
        matchedMasterRecord: nicMatches[0],
        possibleMatches: [{
          record: nicMatches[0],
          matchedField: 'nic',
          matchType: 'exact',
          score: 1.0,
          details: `NIC: ${nicMatches[0].nic}`,
        }],
        conflictDetails: null,
      };
    } else if (nicMatches.length > 1) {
      return {
        ...baseResult,
        status: 'Multiple Matches',
        statusReason: `Found ${nicMatches.length} master records matching NIC "${rawNIC}".`,
        matchingField: 'NIC (Multiple)',
        matchedMasterRecord: null,
        possibleMatches: nicMatches.map((rec) => ({
          record: rec,
          matchedField: 'nic',
          matchType: 'exact',
          score: 1.0,
          details: `${rec.StudentName} - Student #${rec.StudentNumber || rec.id}`,
        })),
        conflictDetails: `Multiple records share NIC "${rawNIC}".`,
      };
    }
  }

  // Priority 3: Email
  if (hasEmail) {
    if (emailMatches.length === 1) {
      return {
        ...baseResult,
        status: 'Verified',
        statusReason: `Exact match found by Email "${emailMatches[0].email}".`,
        matchingField: 'Email (Exact)',
        matchedMasterRecord: emailMatches[0],
        possibleMatches: [{
          record: emailMatches[0],
          matchedField: 'email',
          matchType: 'exact',
          score: 1.0,
          details: `Email: ${emailMatches[0].email}`,
        }],
        conflictDetails: null,
      };
    } else if (emailMatches.length > 1) {
      return {
        ...baseResult,
        status: 'Multiple Matches',
        statusReason: `Found ${emailMatches.length} master records with email "${rawEmail}".`,
        matchingField: 'Email (Multiple)',
        matchedMasterRecord: null,
        possibleMatches: emailMatches.map((rec) => ({
          record: rec,
          matchedField: 'email',
          matchType: 'exact',
          score: 1.0,
          details: `${rec.StudentName} - Student #${rec.StudentNumber || rec.id}`,
        })),
        conflictDetails: `Multiple records share email "${rawEmail}".`,
      };
    }
  }

  // Priority 4: Mobile Number
  if (hasMobile) {
    if (mobileMatches.length === 1) {
      return {
        ...baseResult,
        status: 'Verified',
        statusReason: `Normalized match found by Mobile Number "${mobileMatches[0].mobile}".`,
        matchingField: 'Mobile (Exact)',
        matchedMasterRecord: mobileMatches[0],
        possibleMatches: [{
          record: mobileMatches[0],
          matchedField: 'mobile',
          matchType: 'normalized',
          score: 1.0,
          details: `Mobile: ${mobileMatches[0].mobile}`,
        }],
        conflictDetails: null,
      };
    } else if (mobileMatches.length > 1) {
      return {
        ...baseResult,
        status: 'Multiple Matches',
        statusReason: `Found ${mobileMatches.length} master records with mobile "${rawMobile}".`,
        matchingField: 'Mobile (Multiple)',
        matchedMasterRecord: null,
        possibleMatches: mobileMatches.map((rec) => ({
          record: rec,
          matchedField: 'mobile',
          matchType: 'normalized',
          score: 1.0,
          details: `${rec.StudentName} - Student #${rec.StudentNumber || rec.id}`,
        })),
        conflictDetails: `Multiple records share mobile "${rawMobile}".`,
      };
    }
  }

  // Priority 5: Student Name
  if (hasStudentName) {
    if (exactNameMatches.length === 1) {
      // If only name was provided and matches exactly 1 student
      return {
        ...baseResult,
        status: 'Verified',
        statusReason: `Exact normalized name match found for "${exactNameMatches[0].StudentName}".`,
        matchingField: 'StudentName (Exact)',
        matchedMasterRecord: exactNameMatches[0],
        possibleMatches: [{
          record: exactNameMatches[0],
          matchedField: 'StudentName',
          matchType: 'exact',
          score: 1.0,
          details: `Name: ${exactNameMatches[0].StudentName} (${exactNameMatches[0].StudentNumber || 'No Std No'})`,
        }],
        conflictDetails: null,
      };
    } else if (exactNameMatches.length > 1) {
      return {
        ...baseResult,
        status: 'Multiple Matches',
        statusReason: `Found ${exactNameMatches.length} distinct students in Master database named "${rawStudentName}". Manual review required to pick correct student.`,
        matchingField: 'StudentName (Duplicate Name)',
        matchedMasterRecord: null,
        possibleMatches: exactNameMatches.map((rec) => ({
          record: rec,
          matchedField: 'StudentName',
          matchType: 'exact',
          score: 1.0,
          details: `${rec.StudentName} - #${rec.StudentNumber || rec.id} | Batch: ${rec.batchName || 'N/A'} | Branch: ${rec.AcademicBranch || 'N/A'}`,
        })),
        conflictDetails: `Multiple students have the name "${rawStudentName}".`,
      };
    }

    // Check fuzzy candidates if no exact name match
    if (fuzzyNameCandidates.length > 0) {
      // Sort highest score first
      fuzzyNameCandidates.sort((a, b) => b.score - a.score);

      const top = fuzzyNameCandidates[0];
      const matchScorePercent = Math.round(top.score * 100);

      const candidates: MatchCandidate[] = fuzzyNameCandidates.slice(0, 5).map((c) => ({
        record: c.record,
        matchedField: 'StudentName',
        matchType: 'fuzzy',
        score: c.score,
        details: `${c.record.StudentName} (${Math.round(c.score * 100)}% match) - #${c.record.StudentNumber || c.record.id}`,
      }));

      if (fuzzyNameCandidates.length === 1) {
        return {
          ...baseResult,
          status: 'Possible Match',
          statusReason: `Spelling or format variation detected for "${top.record.StudentName}" (${matchScorePercent}% similarity). Please verify identity.`,
          matchingField: `StudentName (Fuzzy ${matchScorePercent}%)`,
          matchedMasterRecord: top.record,
          possibleMatches: candidates,
          conflictDetails: null,
        };
      } else {
        return {
          ...baseResult,
          status: 'Possible Match',
          statusReason: `Multiple similar names found (Top: "${top.record.StudentName}" at ${matchScorePercent}%). Manual review recommended.`,
          matchingField: `StudentName (Fuzzy ~${matchScorePercent}%)`,
          matchedMasterRecord: top.record,
          possibleMatches: candidates,
          conflictDetails: null,
        };
      }
    }
  }

  // Not Found
  const searchedTerms: string[] = [];
  if (hasStudentNumber) searchedTerms.push(`StudentNumber: ${rawStudentNumber}`);
  if (hasNIC) searchedTerms.push(`NIC: ${rawNIC}`);
  if (hasEmail) searchedTerms.push(`Email: ${rawEmail}`);
  if (hasMobile) searchedTerms.push(`Mobile: ${rawMobile}`);
  if (hasStudentName) searchedTerms.push(`Name: ${rawStudentName}`);

  return {
    ...baseResult,
    status: 'Not Found',
    statusReason: `No matching record found in Master database (${searchedTerms.join(', ')}).`,
    matchingField: 'None',
    matchedMasterRecord: null,
    possibleMatches: [],
    conflictDetails: null,
  };
}
