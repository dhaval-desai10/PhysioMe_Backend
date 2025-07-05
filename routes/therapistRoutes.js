import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { getTherapistProfile, updateTherapistProfile, getDashboardStats, getAppointments } from '../controllers/therapistController.js';
import {
    getTherapistAppointments,
    getTherapistDashboardStats,
    updateAppointmentStatusByTherapist
} from '../controllers/appointmentController.js';
import { addAvailabilitySlots, getTherapistAvailabilitySlots, deleteAvailabilitySlot } from '../controllers/availabilityController.js';
import { upload, logFormData } from '../utils/multer.js';

const router = express.Router();

// Get therapist profile
router.get('/:id/profile', verifyToken, getTherapistProfile);

// Update therapist profile
router.put('/:id/profile', verifyToken, checkRole(['physiotherapist']), upload, logFormData, updateTherapistProfile);

// Get therapist appointments
router.get('/:id/appointments', verifyToken, checkRole(['physiotherapist']), getTherapistAppointments);

// Get therapist dashboard stats  
router.get('/:id/dashboard', verifyToken, checkRole(['physiotherapist']), getTherapistDashboardStats);

// Update appointment status
router.put('/appointments/:appointmentId/status', verifyToken, checkRole(['physiotherapist']), updateAppointmentStatusByTherapist);

// Availability management routes
router.post('/availability', verifyToken, checkRole(['physiotherapist']), addAvailabilitySlots);
router.get('/availability', verifyToken, checkRole(['physiotherapist']), getTherapistAvailabilitySlots);
router.get('/:id/availability', verifyToken, checkRole(['physiotherapist']), getTherapistAvailabilitySlots);
router.delete('/availability/:slotId', verifyToken, checkRole(['physiotherapist']), deleteAvailabilitySlot);

// Debug endpoint to test FormData parsing
router.post('/debug/formdata', verifyToken, upload, logFormData, (req, res) => {
   

    res.json({
        success: true,
        body: req.body,
        file: req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : null,
        bodyKeys: req.body ? Object.keys(req.body) : []
    });
});

export default router;