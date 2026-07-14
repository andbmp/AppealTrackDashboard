import pool from '../config/database';

export const logActivity = async (userId: number, action: string, details: string) => {
  // Implement logic to insert into activity_logs table
  console.log(`Audit Log: ${action} by User ${userId}`);
};
