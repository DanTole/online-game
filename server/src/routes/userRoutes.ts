import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/userController';
import { auth } from '../middleware/auth';
import { validateRegistration, validateLogin } from '../middleware/validators/userValidator';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

export default router; 