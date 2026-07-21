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
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values;
}
