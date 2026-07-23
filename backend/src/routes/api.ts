import { Router } from 'express';
import multer from 'multer';
import { uploadData } from '../controllers/upload';
import { getDashboardStats } from '../controllers/dashboard';
import { getConfig, updateConfig } from '../controllers/admin';
import { login } from '../controllers/auth';
import { getUsers, createUser, toggleUserStatus, deleteUser } from '../controllers/userController';
import { requireRole, Roles } from '../middlewares/rbac';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth route
router.post('/login', login);

// Protected routes
router.post('/upload', requireRole([Roles.ADMIN, Roles.STAFF]), upload.single('file'), uploadData);
router.get('/dashboard', requireRole([Roles.ADMIN, Roles.MANAJEMEN, Roles.STAFF]), getDashboardStats);
router.get('/admin/config', requireRole([Roles.ADMIN]), getConfig);
router.post('/admin/config', requireRole([Roles.ADMIN]), updateConfig);

// User routes
router.get('/users', requireRole([Roles.ADMIN]), getUsers);
router.post('/users', requireRole([Roles.ADMIN]), createUser);
router.put('/users/:id/toggle-status', requireRole([Roles.ADMIN]), toggleUserStatus);
router.delete('/users/:id', requireRole([Roles.ADMIN]), deleteUser);

export default router;
