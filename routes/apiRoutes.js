import express from 'express';
import { protect, isTherapist, isPatient } from '../middlewares/authMiddleware.js';
import * as appointmentController from '../controllers/appointmentController.js';
import * as exerciseController from '../controllers/exerciseController.js';
import * as treatmentPlanController from '../controllers/treatmentPlanController.js';
import * as progressController from '../controllers/progressController.js';
import * as therapistController from '../controllers/therapistController.js';
import * as patientController from '../controllers/patientController.js';
import * as contactController from '../controllers/contactController.js';
import authRoutes from './authRoutes.js';
import therapistRoutes from './therapistRoutes.js';
import patientRoutes from './patientRoutes.js';
import adminRoutes from './adminRoutes.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);

// Contact form routes (public)
router.post('/contact', contactController.sendContactForm);
router.get('/contact/test', contactController.testEmail);

// Protected routes
router.use('/therapist', verifyToken, therapistRoutes);
router.use('/patient', verifyToken, patientRoutes);
router.use('/admin', verifyToken, adminRoutes);

// Get all approved therapists (accessible to patients)
router.get('/therapists/approved', therapistController.getAllApprovedTherapists);

// Patient profile routes for therapists
router.get('/patients/:id/profile', protect, isTherapist, patientController.getPatientProfile);

// Remove duplicate therapist profile routes as they're handled in therapistRoutes.js

// Appointment routes
router.route('/appointments')
  .post(protect, isPatient, appointmentController.createAppointment)
  .get(protect, appointmentController.getAppointments);

router.route('/appointments/:id')
  .get(protect, appointmentController.getAppointmentById)
// .put(protect, isTherapist, appointmentController.updateAppointment) // Needs implementation or use updateAppointmentStatus
// .delete(protect, isTherapist, appointmentController.deleteAppointment); // Needs implementation

router.put('/appointments/:id/status', protect, isTherapist, appointmentController.updateAppointmentStatus);
// router.get('/appointments/available-slots', protect, appointmentController.getAvailableTimeSlots); // Needs implementation
// router.get('/appointments/therapist/:therapistId', protect, appointmentController.getTherapistAppointments); // Needs implementation
// router.get('/appointments/patient/:patientId', protect, isTherapist, appointmentController.getPatientAppointments); // Needs implementation

// Exercise routes
router.route('/exercises')
  .post(protect, isTherapist, exerciseController.createExercise)
  .get(protect, exerciseController.getExercises);

// Route for creating exercises for treatment plans (without file upload)
router.post('/exercises/for-treatment-plan', protect, isTherapist, exerciseController.createExerciseForTreatmentPlan);

router.route('/exercises/:id')
  .get(protect, exerciseController.getExerciseById)
  .put(protect, isTherapist, exerciseController.updateExercise)
  .delete(protect, isTherapist, exerciseController.deleteExercise);

// router.get('/exercises/category/:category', protect, exerciseController.getExercisesByCategory); // Needs implementation
// router.get('/exercises/search', protect, exerciseController.searchExercises); // Needs implementation
// router.post('/exercises/:id/feedback', protect, isPatient, exerciseController.addExerciseFeedback); // Needs implementation

// Treatment plan routes
router.route('/treatment-plans')
  .post(protect, isTherapist, treatmentPlanController.createTreatmentPlan)
  .get(protect, treatmentPlanController.getTreatmentPlans);

router.route('/treatment-plans/:id')
  .get(protect, treatmentPlanController.getTreatmentPlanById)
  .put(protect, isTherapist, treatmentPlanController.updateTreatmentPlan)
  .delete(protect, isTherapist, treatmentPlanController.deleteTreatmentPlan);

router.get('/treatment-plans/patient/:patientId', protect, isTherapist, treatmentPlanController.getPatientTreatmentPlans);
// router.post('/treatment-plans/:id/exercises', protect, isTherapist, treatmentPlanController.addExercisesToPlan); // Check if this exists or needs implementation
// router.delete('/treatment-plans/:id/exercises/:exerciseId', protect, isTherapist, treatmentPlanController.removeExerciseFromPlan); // Check if this exists or needs implementation
// router.put('/treatment-plans/:id/status', protect, isTherapist, treatmentPlanController.updatePlanStatus); // Check if this exists or needs implementation

// Progress routes
router.route('/progress')
  .post(protect, isPatient, progressController.createProgress)
  .get(protect, progressController.getProgressHistory);

router.route('/progress/:id')
  .get(protect, progressController.getProgressById)
  .put(protect, isPatient, progressController.updateProgress)
  .delete(protect, isPatient, progressController.deleteProgress);

router.get('/progress/stats/:treatmentPlanId', protect, progressController.getProgressStats);
router.get('/progress/patient/:patientId', protect, isTherapist, progressController.getPatientProgress);
router.get('/progress/summary/:patientId', protect, isTherapist, progressController.getProgressSummary);
router.get('/progress/treatment-plan/:treatmentPlanId', protect, progressController.getProgressByTreatmentPlan);

// Get available time slots for a therapist
router.get('/therapists/:therapistId/available-slots/:date', appointmentController.getAvailableTimeSlots);

export default router;