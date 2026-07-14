import { Router } from 'express';
import uploadMiddleware from '../middlewares/upload';
import { uploadExcel } from '../controllers/uploadController';
import { getDashboardSummary } from '../controllers/dashboardController';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Backend Appeal Berjalan' });
});

router.get('/dashboard/summary', getDashboardSummary);
router.post('/upload/excel', uploadMiddleware.single('file'), uploadExcel);

export default router;
