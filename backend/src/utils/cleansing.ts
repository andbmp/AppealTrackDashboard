import { CleanedData } from '../interfaces/upload.interface';

// Dictionary Mapping Statis (O(1) Lookup)
const PJP_ALIAS_MAP: Record<string, string> = {
  'NOBU': 'BANK NOBU',
  'YUKK': 'BANK YUKK',
  'DOKU': 'BANK DOKU',
  'OTTOCASH': 'OTTO CASH'
};

export const cleanseAndTransform = (row: any): CleanedData | null => {
  if (!row || Object.keys(row).length === 0) return null;

  // 1. DATE PARSING & CLEANSING
  let rawDate = row['Tanggal'] || row['Date'] || row[1];
  let parsedDate = rawDate;

  if (typeof rawDate === 'number') {
    const jsDate = new Date((rawDate - (25567 + 2)) * 86400 * 1000); 
    parsedDate = jsDate.toISOString().split('T')[0];
  } else if (rawDate instanceof Date) {
    parsedDate = rawDate.toISOString().split('T')[0];
  } else if (typeof rawDate === 'string') {
    const parts = rawDate.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const p0 = parseInt(parts[0]);
        const p1 = parseInt(parts[1]);
        if (p0 > 12) {
          parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (p1 > 12) {
          parsedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        } else {
          // Asumsi MM/DD/YYYY untuk kecocokan Excel
          parsedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      } else if (parts[0].length === 4) {
        parsedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }

  if (!parsedDate) return null;

  // 2. PJP CLEANSING (Trim, Uppercase, Alias, Null Handling)
  let rawPjp = row['PJP'] || row['pjp'];
  let pjp_name = 'TIDAK DIKETAHUI';
  if (rawPjp && typeof rawPjp === 'string' && rawPjp.trim() !== '') {
    pjp_name = rawPjp.trim().toUpperCase();
    if (PJP_ALIAS_MAP[pjp_name]) {
      pjp_name = PJP_ALIAS_MAP[pjp_name];
    }
  }

  // 3. MCC CLEANSING
  let rawMcc = row['MCC'] || row['mcc'];
  let mcc = 'UNKNOWN';
  if (rawMcc && String(rawMcc).trim() !== '') {
    mcc = String(rawMcc).trim().toUpperCase();
  }

  // 4. TIERING
  let pjp_tier = row['Tier'] ? String(row['Tier']).trim() : 'Tier 3';

  // 5. ACTION & STATUS (Deteksi Keyword)
  const allValues = Object.values(row).map(String).join(' ').toLowerCase();
  let detail_action = 'Rekomendasi Nama';
  let status = 'Pending';
  
  if (allValues.includes('whitelist')) {
      detail_action = 'Whitelist';
      status = 'Done';
  } else if (allValues.includes('reject') || allValues.includes('tolak')) {
      detail_action = 'Reject';
      status = 'Rejected';
  } else if (allValues.includes('mcc')) {
      detail_action = 'Rekomendasi MCC';
      status = 'Pending';
  } else if (allValues.includes('nama') || allValues.includes('rekomendasi')) {
      detail_action = 'Rekomendasi Nama';
      status = 'Pending';
  } else if (allValues.includes('done') || allValues.includes('selesai') || allValues.includes('sesuai')) {
      status = 'Done';
      detail_action = 'Whitelist';
  }

  return {
    report_date: String(parsedDate),
    pjp_name,
    pjp_tier,
    mcc,
    status,
    detail_action
  };
};
