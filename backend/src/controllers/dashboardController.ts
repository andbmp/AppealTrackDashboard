import { Request, Response } from 'express';
import pool from '../config/database';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // Nanti akan diisi query riil dari database
    res.json({
      success: true,
      data: {
        totalAppeals: 12482,
        resolved: 9234,
        pending: 3248,
        anomalies: 12
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
