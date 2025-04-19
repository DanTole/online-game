import express from 'express';
import { AuthController } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);
router.put('/me', auth, authController.updateProfile);

export default router; 