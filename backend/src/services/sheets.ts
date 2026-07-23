import { google } from 'googleapis';

export async function fetchGoogleSheetData(spreadsheetId: string, range: string) {
  // In a real scenario, you need proper credentials (service account or OAuth)
  // For simplicity and testing without a service account key, we assume the sheet is public
  // or we need an API Key configured.
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured.");
  }

  const sheets = google.sheets({ version: 'v4', auth: apiKey });
  
  // Ambil metadata spreadsheet untuk mendapatkan nama sheet pertama secara dinamis
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheetName = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';
  
  // Gunakan nama sheet pertama tanpa batasan baris untuk mengambil SEMUA data
  // Kita kembalikan ke FORMATTED_VALUE agar selalu mendapatkan teks yang akan di-parse oleh logika pintar MM/DD/YYYY kita
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: firstSheetName,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  return response.data.values;
}
