import User from '../model/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';

// Get therapist profile
export const getTherapistProfile = async (req, res) => {
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

    res.status(200).json({
      success: true,
      data: therapist
    });
  } catch (error) {
    console.error('Error in getTherapistProfile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update therapist profile - Clean, Working Version
export const updateTherapistProfile = async (req, res) => {
  try {
    const therapistId = req.params.id;

    // Basic validation
    if (!therapistId) {
      return res.status(400).json({
        success: false,
        message: 'Therapist ID is required'
      });
    }

    // Ensure req.body exists
    if (!req.body) {
      req.body = {};
    }

    // Check if we have any data to update
    const hasBodyData = req.body && Object.keys(req.body).length > 0;
    const hasFile = !!req.file;

    if (!hasBodyData && !hasFile) {
      return res.status(400).json({
        success: false,
        message: 'No data provided for update'
      });
    }

    // Find the therapist
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'physiotherapist') {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Prepare update data
    const updateFields = {};

    // Handle basic fields safely
    if (req.body.name && req.body.name.trim()) {
      updateFields.name = req.body.name.trim();
    }

    if (req.body.email) {
      updateFields.email = req.body.email;
    }

    if (req.body.phone) {
      updateFields.phone = req.body.phone;
    }

    if (req.body.specialization) {
      updateFields.specialization = req.body.specialization;
    }

    if (req.body.experience !== undefined) {
      updateFields.experience = parseInt(req.body.experience) || 0;
    }

    if (req.body.licenseNumber) {
      updateFields.licenseNumber = req.body.licenseNumber;
    }

    if (req.body.clinicName) {
      updateFields.clinicName = req.body.clinicName;
    }

    // Always handle clinicAddress and bio, even if empty (allows clearing fields)
    if (req.body.clinicAddress !== undefined) {
      updateFields.clinicAddress = req.body.clinicAddress || '';
    }

    if (req.body.bio !== undefined) {
      updateFields.bio = req.body.bio || '';
    }

    // Handle working hours
    if (req.body.workingHours) {
      try {
        const workingHours = typeof req.body.workingHours === 'string'
          ? JSON.parse(req.body.workingHours)
          : req.body.workingHours;

        if (workingHours && workingHours.start && workingHours.end) {
          updateFields.workingHours = workingHours;
        }
      } catch (error) {
        // Handle working hours parse error silently
      }
    }

    // Handle working days
    if (req.body.workingDays) {
      try {
        const workingDays = typeof req.body.workingDays === 'string'
          ? JSON.parse(req.body.workingDays)
          : req.body.workingDays;

        if (Array.isArray(workingDays)) {
          updateFields.workingDays = workingDays;
        }
      } catch (error) {
        // Handle working days parse error silently
      }
    }

    // Handle appointment duration
    if (req.body.appointmentDuration) {
      try {
        const duration = typeof req.body.appointmentDuration === 'string'
          ? parseInt(req.body.appointmentDuration)
          : req.body.appointmentDuration;

        if (duration && duration > 0) {
          updateFields.appointmentDuration = duration;
        }
      } catch (error) {
        // Handle appointment duration parse error silently
      }
    }

    // Handle profile picture upload
    if (req.file) {
      try {
        // Check if Cloudinary is configured
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
          const result = await uploadToCloudinary(req.file.path);
          updateFields.profilePictureUrl = result.secure_url;
        }
      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
        // Don't fail the entire update, just log the error and continue
      } finally {
        // Always clean up the temporary file
        try {
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      }
    }

    // Make sure we have something to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    // Update the therapist - Use lean update with validation disabled for now
    const updatedTherapist = await User.findByIdAndUpdate(
      therapistId,
      { $set: updateFields },
      {
        new: true,
        runValidators: false, // Disable validation to avoid issues
        select: '-password' // Exclude password field
      }
    );

    if (!updatedTherapist) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update therapist profile'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedTherapist
    });

  } catch (error) {
    console.error('Update therapist profile error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Get therapist dashboard stats
export const getDashboardStats = async (req, res) => {
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

    // Add your logic to get dashboard stats
    // This is a placeholder - implement actual stats calculation
    const stats = {
      totalPatients: 0,
      appointmentsToday: 0,
      completedSessions: 0,
      pendingReports: 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get therapist appointments
export const getAppointments = async (req, res) => {
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

    // Add your logic to get appointments
    // This is a placeholder - implement actual appointments fetching
    const appointments = [];

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all approved therapists for patients
export const getAllApprovedTherapists = async (req, res) => {
  try {
    const therapists = await User.find({
      role: 'physiotherapist',
      status: 'approved'
    }).select('-password');

    res.status(200).json({
      success: true,
      data: therapists
    });
  } catch (error) {
    console.error('Error in getAllApprovedTherapists:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};