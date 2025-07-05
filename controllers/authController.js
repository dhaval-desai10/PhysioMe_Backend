import User from '../model/User.js';
import { generateToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

// Register new user
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      specialization,
      yearsOfExperience,
      licenseNumber,
      clinicName,
      clinicAddress,
      dateOfBirth,
      medicalHistory
    } = req.body;

    // Validate required fields for physiotherapists
    if (role === 'physiotherapist') {
      if (!specialization) {
        return res.status(400).json({
          success: false,
          message: 'Specialization is required for physiotherapists'
        });
      }
      if (!licenseNumber) {
        return res.status(400).json({
          success: false,
          message: 'License number is required for physiotherapists'
        });
      }
      if (!yearsOfExperience) {
        return res.status(400).json({
          success: false,
          message: 'Years of experience is required for physiotherapists'
        });
      }
      if (!clinicName) {
        return res.status(400).json({
          success: false,
          message: 'Clinic name is required for physiotherapists'
        });
      }
      if (!clinicAddress) {
        return res.status(400).json({
          success: false,
          message: 'Clinic address is required for physiotherapists'
        });
      }
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for physiotherapists'
        });
      }
    }

    const name = `${firstName} ${lastName}`.trim();

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role: role || 'patient',
      // Add role-specific fields
      ...(role === 'physiotherapist' && {
        specialization,
        experience: Number(yearsOfExperience),
        licenseNumber,
        clinicName,
        clinicAddress,
        phone,
        workingHours: {
          start: '09:00',
          end: '17:00'
        },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }),
      ...(role === 'patient' && {
        phone,
        dateOfBirth,
        medicalHistory,
      })
    };

    // Remove undefined fields
    Object.keys(userData).forEach(key => {
      if (userData[key] === undefined) {
        delete userData[key];
      }
    });

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Get user data without password
    const userDataWithoutPassword = user.getProfile();

    res.status(201).json({
      success: true,
      data: userDataWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// Direct admin login
export const directAdminLogin = async (req, res) => {
  try {
    const admin = await User.findOne({
      email: 'admin@gmail.com',
      role: 'admin'
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return admin data
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        redirect: '/admin/dashboard'
      }
    });
  } catch (error) {
    console.error('Error in directAdminLogin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Regular login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // For therapists, we'll allow login regardless of approval status
    // This way they can see their profile even if not approved
    // The frontend will handle restricting certain features based on status

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data and token
    res.status(200).json({
      success: true,
      data: {
        token,
        user: user.getProfile()
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Logout user
export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        experience: user.experience,
        licenseNumber: user.licenseNumber,
        rating: user.rating,
        profilePictureUrl: user.profilePictureUrl,
        workingHours: user.workingHours,
        workingDays: user.workingDays,
        bio: user.bio,
        clinicName: user.clinicName,
        clinicAddress: user.clinicAddress,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, password } = req.body;

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      data: user.getProfile()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all physiotherapists (for patients to view)
export const getPhysiotherapists = async (req, res) => {
  try {
    const physiotherapists = await User.find({ role: 'physiotherapist' })
      .select('name email specialization experience rating')
      .sort({ rating: -1 });

    res.status(200).json({
      success: true,
      data: physiotherapists
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};