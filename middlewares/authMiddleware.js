import jwt from 'jsonwebtoken';
import User from '../model/User.js';

// Protect routes
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.token) {
      token = req.cookies.token;
      console.log('Token found in cookies');
    } else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header');
    }

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully, user ID:', decoded.id);
      req.user = await User.findById(decoded.id).select('-password');
      console.log('User found:', req.user ? `${req.user.name} (${req.user.role})` : 'null');
      next();
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if user is a therapist
export const isTherapist = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (req.user.role !== 'physiotherapist') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as a therapist'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check if user is a patient
export const isPatient = async (req, res, next) => {
  try {
    console.log('Checking if user is patient...');
    console.log('Current user:', req.user ? `${req.user.name} (${req.user.role})` : 'null');

    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (req.user.role !== 'patient') {
      console.log(`User role ${req.user.role} is not patient, access denied`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized as a patient'
      });
    }

    console.log('User verified as patient, proceeding...');
    next();
  } catch (error) {
    console.error('Error in isPatient middleware:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Middleware to check user role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};