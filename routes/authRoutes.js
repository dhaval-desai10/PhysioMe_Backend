import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getProfile, 
  updateProfile,
  directAdminLogin 
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Direct admin login route
router.get('/admin-login', directAdminLogin);

// Regular auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getProfile);
router.post('/logout', protect, logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;