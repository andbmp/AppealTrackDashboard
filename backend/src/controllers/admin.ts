import { Request, Response } from 'express';

// In a real database, this would be stored in an `app_config` table
const configState = {
  sheetUrl: '',
  emails: [] as string[]
};

export const getConfig = (req: Request, res: Response) => {
  res.json(configState);
};

export const updateConfig = (req: Request, res: Response) => {
  const { sheetUrl, emails } = req.body;
  if (sheetUrl !== undefined) configState.sheetUrl = sheetUrl;
  if (emails !== undefined) configState.emails = emails;
  res.json({ message: 'Config updated', config: configState });
};
