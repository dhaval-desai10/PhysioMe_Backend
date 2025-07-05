import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['patient', 'physiotherapist', 'admin'],
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Additional fields for physiotherapists
  specialization: {
    type: String,
    required: function () {
      return this.role === 'physiotherapist';
    },
    trim: true
  },
  licenseNumber: {
    type: String,
    required: function () {
      return this.role === 'physiotherapist';
    },
    trim: true
  },
  experience: {
    type: Number,
    required: function () {
      return this.role === 'physiotherapist';
    },
    min: [0, 'Experience cannot be negative'],
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  profilePictureUrl: {
    type: String,
    trim: true
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00',
      trim: true
    },
    end: {
      type: String,
      default: '17:00',
      trim: true
    }
  },
  appointmentDuration: {
    type: Number,
    default: 30, // Default 30 minutes
    min: 15,
    max: 120
  },
  workingDays: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    validate: {
      validator: function (days) {
        return Array.isArray(days) && days.every(day =>
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)
        );
      },
      message: 'Invalid working days'
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  clinicName: {
    type: String,
    trim: true
  },
  clinicAddress: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9+\-\s()]*$/, 'Please enter a valid phone number']
  },
  // Additional fields for patients
  dateOfBirth: {
    type: Date,
    required: false
  },
  medicalHistory: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user's full profile
userSchema.methods.getProfile = function () {
  const profile = {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status, // Include status field
    createdAt: this.createdAt
  };

  if (this.role === 'physiotherapist') {
    profile.specialization = this.specialization;
    profile.licenseNumber = this.licenseNumber;
    profile.experience = this.experience;
    profile.rating = this.rating;
    profile.profilePictureUrl = this.profilePictureUrl;
    profile.workingHours = this.workingHours;
    profile.workingDays = this.workingDays;
    profile.appointmentDuration = this.appointmentDuration;
    profile.bio = this.bio;
    profile.clinicName = this.clinicName;
    profile.clinicAddress = this.clinicAddress;
    profile.phone = this.phone;
  } else if (this.role === 'patient') {
    profile.phone = this.phone;
    profile.dateOfBirth = this.dateOfBirth;
    profile.medicalHistory = this.medicalHistory;
    profile.profilePictureUrl = this.profilePictureUrl;
  }

  return profile;
};

// Method to check if user is a physiotherapist
userSchema.methods.isPhysiotherapist = function () {
  return this.role === 'physiotherapist';
};

// Method to check if user is a patient
userSchema.methods.isPatient = function () {
  return this.role === 'patient';
};

const User = mongoose.model('User', userSchema);

export default User;