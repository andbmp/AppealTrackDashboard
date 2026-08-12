import { fetchGoogleSheetData } from './src/services/sheets';
import { cleanseAndTransform } from './src/utils/cleansing';
import dotenv from 'dotenv';
dotenv.config();

async function findDuplicates() {
  const spreadsheetId = '1_qlqlve-ECNHw7yi8t1SCY3GkEkpcdVBlLDnVDTUr6M';
  try {
    const rawData = await fetchGoogleSheetData(spreadsheetId, '');
    
    if (!rawData || rawData.length === 0) {
      console.log('No data found');
      return;
    }
    
    // Extract headers
    const headers = rawData[0].map(String);
    const rows = rawData.slice(1);
    
    const seen = new Set();
    const duplicates = [];
    
    for (let i = 0; i < rows.length; i++) {
      const rowArr = rows[i];
      // Convert to object
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = rowArr[idx] !== undefined ? rowArr[idx] : '';
      });
      
      const cleaned = cleanseAndTransform(rowObj);
      if (cleaned) {
        const key = `${cleaned.report_date}|${cleaned.pjp_name}|${cleaned.mcc}|${cleaned.merchant_name}`;
        if (seen.has(key)) {
          duplicates.push({
            original_row: i + 2,
            ...cleaned
          });
        } else {
          seen.add(key);
        }
      }
    }
    
    console.log(`Found ${duplicates.length} duplicates:`);
    duplicates.forEach((d, i) => {
      console.log(`${i+1}. Row ${d.original_row} - Merchant: ${d.merchant_name} (PJP: ${d.pjp_name}, Tgl: ${d.report_date}, MCC: ${d.mcc})`);
    });
    
  } catch (error) {
    console.error(error);
  }
}

findDuplicates();
