import { Request, Response } from 'express';
import { processExcelUpload } from '../services/excelService';

export const uploadExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'File tidak ditemukan' });
      return;
    }
    const result = await processExcelUpload(req.file.path, req.file.originalname);
    res.json({ 
      success: true, 
      message: `File berhasil diproses. ${result.inserted} data tersimpan, ${result.errors.length} baris gagal divalidasi.`,
      fileName: result.fileName,
      inserted: result.inserted,
      errors: result.errors
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Gagal memproses file' });
  }
};
