import User from '../model/User.js';
import Patient from '../model/Patient.js';
import cloudinary from '../utils/cloudinary.js';

// Get patient profile
export const getPatientProfile = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Find patient by ID
    const patient = await User.findOne({
      _id: patientId,
      role: 'patient'
    }).select('-password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get additional patient data
    const patientData = await Patient.findOne({ userId: patientId });

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
    console.error('Error in getPatientProfile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching patient profile'
    });
  }
};

// Update patient profile
export const updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Find patient
    const patient = await User.findOne({
      _id: patientId,
      role: 'patient'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Handle profile picture upload
    if (req.file) {
      try {
        // For memory storage, we need to upload from buffer
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          {
            folder: 'physiome/patients',
            width: 500,
            crop: 'scale'
          }
        );

        // Delete old profile picture if exists
        if (patient.profilePictureUrl) {
          try {
            const publicId = patient.profilePictureUrl.split('/').pop().split('.')[0];
            if (publicId) {
              await cloudinary.uploader.destroy(`physiome/patients/${publicId}`);
            }
          } catch (deleteError) {
            console.error('Error deleting old profile picture:', deleteError);
          }
        }

        patient.profilePictureUrl = result.secure_url;
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile picture'
        });
      }
    }

    // Update basic fields in User model
    if (req.body.firstName && req.body.lastName) {
      patient.name = `${req.body.firstName} ${req.body.lastName}`.trim();
    }
    if (req.body.phone !== undefined) patient.phone = req.body.phone;
    if (req.body.dateOfBirth !== undefined && req.body.dateOfBirth !== '') {
      patient.dateOfBirth = new Date(req.body.dateOfBirth);
    }
    if (req.body.medicalHistory !== undefined) {
      patient.medicalHistory = req.body.medicalHistory;
    }

    await patient.save();

    // Update or create patient-specific data
    let patientData = await Patient.findOne({ userId: patientId });
    if (!patientData) {
      patientData = new Patient({ userId: patientId });
    }

    // Update patient-specific fields in Patient collection (for additional data like address, gender, etc.)
    if (req.body.gender !== undefined) patientData.gender = req.body.gender;
    if (req.body.address !== undefined) {
      patientData.address = req.body.address;
    }
    if (req.body.allergies !== undefined) patientData.allergies = req.body.allergies;
    if (req.body.medications !== undefined) patientData.medications = req.body.medications;

    await patientData.save();

    // Get the updated profile using the User model's getProfile method
    const updatedUser = await User.findById(patientId).select('-password');
    const updatedPatientData = await Patient.findOne({ userId: patientId });

    const updatedProfile = {
      ...updatedUser.getProfile(),
      ...(updatedPatientData ? {
        gender: updatedPatientData.gender || '',
        address: updatedPatientData.address || '',
        allergies: updatedPatientData.allergies || '',
        medications: updatedPatientData.medications || '',
        emergencyContact: updatedPatientData.emergencyContact || { name: '', relationship: '', phone: '' },
        insuranceInfo: updatedPatientData.insuranceInfo || { provider: '', policyNumber: '', expiryDate: '' }
      } : {})
    };

    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error in updatePatientProfile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 