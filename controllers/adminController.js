import User from '../model/User.js';
import Patient from '../model/Patient.js';

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalTherapists = await User.countDocuments({ role: 'physiotherapist' });
    const pendingApprovals = await User.countDocuments({
      role: 'physiotherapist',
      status: 'pending'
    });
    const approvedTherapists = await User.countDocuments({
      role: 'physiotherapist',
      status: 'approved'
    });
    const rejectedTherapists = await User.countDocuments({
      role: 'physiotherapist',
      status: 'rejected'
    });
    const totalPatients = await User.countDocuments({ role: 'patient' });

    res.status(200).json({
      success: true,
      data: {
        totalTherapists,
        pendingApprovals,
        approvedTherapists,
        rejectedTherapists,
        totalPatients
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get pending therapist approvals
export const getPendingTherapists = async (req, res) => {
  try {
    const pendingTherapists = await User.find({
      role: 'physiotherapist',
      status: 'pending'
    }).select('-password');

    res.status(200).json({
      success: true,
      data: pendingTherapists
    });
  } catch (error) {
    console.error('Error in getPendingTherapists:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single therapist details
export const getTherapistDetails = async (req, res) => {
  try {
    const therapist = await User.findOne({
      _id: req.params.id,
      role: 'physiotherapist'
    }).select('-password');

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Use the getProfile method to get properly formatted data including bio
    const therapistProfile = therapist.getProfile();

    res.status(200).json({
      success: true,
      data: therapistProfile
    });
  } catch (error) {
    console.error('Error in getTherapistDetails:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve therapist
export const approveTherapist = async (req, res) => {
  try {
    const therapist = await User.findOne({
      _id: req.params.id,
      role: 'physiotherapist'
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    therapist.status = 'approved';
    await therapist.save();

    res.status(200).json({
      success: true,
      message: 'Therapist approved successfully',
      data: therapist
    });
  } catch (error) {
    console.error('Error in approveTherapist:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reject therapist
export const rejectTherapist = async (req, res) => {
  try {
    const therapist = await User.findOne({
      _id: req.params.id,
      role: 'physiotherapist'
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    therapist.status = 'rejected';
    await therapist.save();

    res.status(200).json({
      success: true,
      message: 'Therapist rejected successfully',
      data: therapist
    });
  } catch (error) {
    console.error('Error in rejectTherapist:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all registered therapists
export const getAllTherapists = async (req, res) => {
  try {
    const therapists = await User.find({ role: 'physiotherapist' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: therapists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all registered patients
export const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single patient details
export const getPatientDetails = async (req, res) => {
  try {
    const patient = await User.findOne({
      _id: req.params.id,
      role: 'patient'
    }).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get additional patient data
    const patientData = await Patient.findOne({ userId: req.params.id });

    // Use the User model's getProfile method to get basic data
    const basicProfile = patient.getProfile();

    // Combine with additional patient data if exists
    const profileData = {
      ...basicProfile,
      // Override with additional data from Patient collection if available
      ...(patientData ? {
        gender: patientData.gender || '',
        address: patientData.address || '',
        allergies: patientData.allergies || '',
        medications: patientData.medications || '',
        emergencyContact: patientData.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        insuranceInfo: patientData.insuranceInfo || {
          provider: '',
          policyNumber: '',
          expiryDate: ''
        }
      } : {
        gender: '',
        address: '',
        allergies: '',
        medications: '',
        emergencyContact: { name: '', relationship: '', phone: '' },
        insuranceInfo: { provider: '', policyNumber: '', expiryDate: '' }
      })
    };

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error in getPatientDetails:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};