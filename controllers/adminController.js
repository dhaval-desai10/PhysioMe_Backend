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
    const { reason, permanent } = req.body;

    // Check if this is a delete request
    if (reason === 'ADMIN_DELETE' && permanent) {
      // Handle therapist deletion
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

      // Actually delete the therapist
      await User.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Therapist deleted successfully'
      });
    }

    // Check if this is a patient delete request
    if (reason === 'ADMIN_DELETE_PATIENT' && permanent) {
      // Handle patient deletion
      const patient = await User.findOne({
        _id: req.params.id,
        role: 'patient'
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Delete additional patient data if exists
      await Patient.findOneAndDelete({ userId: req.params.id });

      // Delete the patient from User collection
      await User.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Patient deleted successfully'
      });
    }

    // Regular rejection logic for therapists
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

// Delete therapist
export const deleteTherapist = async (req, res) => {
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

    // Delete the therapist
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Therapist deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTherapist:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await User.findOne({
      _id: req.params.id,
      role: 'patient'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Delete additional patient data if exists
    await Patient.findOneAndDelete({ userId: req.params.id });

    // Delete the patient from User collection
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePatient:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Universal user management (for both therapists and patients)
export const manageUser = async (req, res) => {
  try {
    const { action, reason, permanent } = req.body;
    const userId = req.params.id;

    // Find user regardless of role
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle deletion request
    if (action === 'DELETE' && permanent) {
      // Delete additional patient data if it's a patient
      if (user.role === 'patient') {
        await Patient.findOneAndDelete({ userId: userId });
      }

      // Delete the user from User collection
      await User.findByIdAndDelete(userId);

      return res.status(200).json({
        success: true,
        message: `${user.role === 'patient' ? 'Patient' : 'Therapist'} deleted successfully`
      });
    }

    // Handle status updates for therapists
    if (user.role === 'physiotherapist') {
      if (action === 'APPROVE') {
        user.status = 'approved';
      } else if (action === 'REJECT') {
        user.status = 'rejected';
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `User ${action.toLowerCase()}d successfully`,
      data: user
    });
  } catch (error) {
    console.error('Error in manageUser:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};