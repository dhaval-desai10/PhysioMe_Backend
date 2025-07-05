import Appointment from '../model/Appointment.js';
import User from '../model/User.js';
import { bookSlot, unbookSlot, getAvailableSlotsForPatient } from './availabilityController.js';

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    console.log('Creating appointment with request body:', req.body);
    console.log('User from token:', req.user);

    const { physiotherapistId, date, time, visitType, type, notes, slotId } = req.body;

    // Handle both old slot-based and new direct booking approaches
    if (slotId) {
      // Old approach with slot booking
      return await createAppointmentFromSlot(req, res);
    }

    // New approach: direct booking with date, time, and visitType
    if (!physiotherapistId || !date || !time || !visitType) {
      console.log('Missing required fields:', { physiotherapistId, date, time, visitType });
      return res.status(400).json({
        success: false,
        message: 'Physiotherapist ID, date, time, and visit type are required'
      });
    }

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.log('User not authenticated:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Verify therapist exists and is approved
    const physiotherapist = await User.findOne({
      _id: physiotherapistId,
      role: 'physiotherapist',
      status: 'approved'
    });

    if (!physiotherapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found or not approved'
      });
    }

    // Check if the time slot is available
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(appointmentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAppointment = await Appointment.findOne({
      physiotherapistId,
      date: {
        $gte: appointmentDate,
        $lt: nextDay
      },
      time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user._id,
      physiotherapistId,
      date: appointmentDate,
      time,
      visitType,
      type: type || 'initial',
      notes: notes || ''
    });

    // Populate patient and therapist details
    await appointment.populate('patientId', 'name email');
    await appointment.populate('physiotherapistId', 'name email');

    console.log('Appointment created successfully:', appointment._id);

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to create appointment';
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid appointment data provided';
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid ID format provided';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

// Helper function for old slot-based booking
const createAppointmentFromSlot = async (req, res) => {
  try {
    const { slotId, type, notes } = req.body;

    // Validate required fields
    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: 'Slot ID is required'
      });
    }

    // Get the slot details
    const AvailabilitySlot = (await import('../model/AvailabilitySlot.js')).default;
    const slot = await AvailabilitySlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked'
      });
    }

    // Verify therapist exists
    const physiotherapist = await User.findOne({
      _id: slot.therapistId,
      role: 'physiotherapist',
      status: 'approved'
    });

    if (!physiotherapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found or not approved'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user._id,
      physiotherapistId: slot.therapistId,
      date: slot.date,
      time: slot.time,
      visitType: 'clinic', // Default for slot-based booking
      type: type || 'initial',
      notes: notes || ''
    });

    // Book the slot
    await bookSlot(slotId, appointment._id);

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment from slot:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all appointments (filtered by role)
export const getAppointments = async (req, res) => {
  try {
    const query = {};

    // Filter based on user role
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'physiotherapist') {
      query.physiotherapistId = req.user._id;
    }

    // Add date filter if provided
    if (req.query.date) {
      query.date = req.query.date;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .populate('physiotherapistId', 'name email')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('physiotherapistId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify access rights
    if (req.user.role === 'patient' && appointment.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }
    if (req.user.role === 'physiotherapist' && appointment.physiotherapistId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only physiotherapist can update status
    if (req.user.role !== 'physiotherapist' ||
      appointment.physiotherapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    const { status } = req.body;
    appointment.status = status;
    await appointment.save();

    // Get patient details for logging
    const patient = await User.findById(appointment.patientId);
    console.log('Appointment status updated for patient:', patient.name);

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify ownership (both patient and physiotherapist can cancel)
    if (appointment.patientId.toString() !== req.user._id.toString() &&
      appointment.physiotherapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    // Only allow cancellation of pending or confirmed appointments
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel appointment with status: ${appointment.status}` });
    }

    // Find and unbook the slot
    const AvailabilitySlot = (await import('../model/AvailabilitySlot.js')).default;
    const slot = await AvailabilitySlot.findOne({
      therapistId: appointment.physiotherapistId,
      date: appointment.date,
      time: appointment.time,
      appointmentId: appointment._id
    });

    if (slot) {
      await unbookSlot(slot._id);
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = req.body.reason;
    await appointment.save();

    // Get other party's details for notification
    const otherParty = await User.findById(
      req.user.role === 'patient' ? appointment.physiotherapistId : appointment.patientId
    );

    console.log('Appointment cancelled, other party notified:', otherParty.name);

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get available time slots for a therapist on a specific date
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { therapistId, date } = req.params;

    return await getAvailableSlotsForPatient(req, res);
  } catch (error) {
    console.error('Error getting available time slots:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get therapist's appointments with populated patient data
export const getTherapistAppointments = async (req, res) => {
  try {
    const therapistId = req.params.id || req.user._id;

    const appointments = await Appointment.find({
      physiotherapistId: therapistId
    })
      .populate('patientId', 'name email phone')
      .sort({ date: 1, time: 1 });

    // Format the response to include patient name directly
    const formattedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      patientName: appointment.patientId.name,
      patientEmail: appointment.patientId.email,
      patientPhone: appointment.patientId.phone,
      date: appointment.date,
      time: appointment.time,
      visitType: appointment.visitType || 'clinic', // Default to clinic for old appointments
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      createdAt: appointment.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedAppointments
    });
  } catch (error) {
    console.error('Error getting therapist appointments:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get therapist dashboard stats
export const getTherapistDashboardStats = async (req, res) => {
  try {
    const therapistId = req.params.id || req.user._id;

    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current month start and end
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Count total unique patients
    const totalPatients = await Appointment.distinct('patientId', {
      physiotherapistId: therapistId,
      status: { $in: ['confirmed', 'completed'] }
    });

    // Count today's appointments
    const appointmentsToday = await Appointment.countDocuments({
      physiotherapistId: therapistId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Count completed sessions this month
    const completedSessions = await Appointment.countDocuments({
      physiotherapistId: therapistId,
      date: { $gte: monthStart, $lte: monthEnd },
      status: 'completed'
    });

    // Count pending reports (appointments completed but no progress report)
    const pendingReports = await Appointment.countDocuments({
      physiotherapistId: therapistId,
      status: 'completed',
      // Add logic here if you have a progress report system
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients: totalPatients.length,
        appointmentsToday,
        completedSessions,
        pendingReports
      }
    });
  } catch (error) {
    console.error('Error getting therapist dashboard stats:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update appointment status by therapist
export const updateAppointmentStatusByTherapist = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;
    const therapistId = req.user._id;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find the appointment and verify it belongs to this therapist
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      physiotherapistId: therapistId
    }).populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update the appointment
    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }

    // If cancelling, free up the slot
    if (status === 'cancelled') {
      // Find and update the availability slot
      const AvailabilitySlot = (await import('../model/AvailabilitySlot.js')).default;
      await AvailabilitySlot.findOneAndUpdate(
        {
          therapistId,
          date: appointment.date,
          time: appointment.time
        },
        { isBooked: false, appointmentId: null }
      );
    }

    await appointment.save();

    console.log('Appointment status updated:', status);

    res.status(200).json({
      success: true,
      data: appointment,
      message: `Appointment ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};