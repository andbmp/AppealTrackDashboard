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

  // 4. MERCHANT NAME & TIERING
  let merchant_name = 'UNKNOWN';
  if (row['Nama Merchant'] && String(row['Nama Merchant']).trim() !== '') {
    merchant_name = String(row['Nama Merchant']).trim();
  }

  let pjp_tier = row['Tier'] ? String(row['Tier']).trim() : 'Tier 3';

  // 5. ACTION & STATUS (Deteksi Keyword)
  const allValues = Object.values(row).map(String).join(' ').toLowerCase();
  const actionsFound: string[] = [];
  
  if (allValues.includes('whitelist') || allValues.includes('done') || allValues.includes('selesai') || allValues.includes('sesuai')) {
      actionsFound.push('Whitelist');
  }
  if (allValues.includes('reject') || allValues.includes('tolak')) {
      actionsFound.push('Reject');
  }
  if (allValues.includes('mcc')) {
      actionsFound.push('Rekomendasi MCC');
  }
  if (allValues.includes('nama') || allValues.includes('rekomendasi nama')) {
      actionsFound.push('Rekomendasi Nama');
  }

  // Jika tidak ditemukan apa-apa, fallback ke Pending Manual Review
  let detail_action = actionsFound.length > 0 ? actionsFound.join(' & ') : 'Pending Manual Review';
  
  // Status Database Internal Tetap 1 Final State (untuk Grafik Pie & Garis)
  let status = 'Pending';
  if (actionsFound.includes('Reject')) {
      status = 'Rejected';
  } else if (actionsFound.includes('Whitelist')) {
      status = 'Done';
  }

  return {
    report_date: String(parsedDate),
    pjp_name,
    pjp_tier,
    mcc,
    merchant_name,
    status,
    detail_action
  };
};
