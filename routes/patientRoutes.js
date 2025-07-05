import express from 'express';
import { getPatientProfile, updatePatientProfile } from '../controllers/patientController.js';
import { getAppointments, cancelAppointment } from '../controllers/appointmentController.js';
import { verifyToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Get patient profile
router.get('/profile/:id', verifyToken, getPatientProfile);

// Update patient profile
router.put('/profile/:id', verifyToken, upload.single('profilePicture'), updatePatientProfile);

// Get patient appointments
router.get('/appointments', verifyToken, getAppointments);

// Cancel appointment
router.put('/appointments/:id/cancel', verifyToken, cancelAppointment);

export default router; 