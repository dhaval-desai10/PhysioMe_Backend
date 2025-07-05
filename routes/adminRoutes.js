import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import {
  getDashboardStats,
  getPendingTherapists,
  getTherapistDetails,
  approveTherapist,
  rejectTherapist,
  getAllTherapists,
  getAllPatients,
  getPatientDetails
} from '../controllers/adminController.js';

const router = express.Router();

// Apply both verifyToken and isAdmin middleware to all routes
router.use(verifyToken);
router.use(isAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Therapist approval routes
router.get('/therapist-approvals', getPendingTherapists);
router.get('/therapist-approvals/:id', getTherapistDetails);
router.put('/therapist-approvals/:id/approve', approveTherapist);
router.put('/therapist-approvals/:id/reject', rejectTherapist);

// Get all therapists
router.get('/therapists', getAllTherapists);

// Get single therapist details
router.get('/therapists/:id', getTherapistDetails);

// Get all patients
router.get('/patients', getAllPatients);

// Get single patient details
router.get('/patients/:id', getPatientDetails);

export default router;