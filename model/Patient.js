import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  address: {
    type: String,
    required: false
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  conditions: [{
    type: String
  }],
  allergies: {
    type: String,
    default: ''
  },
  medications: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  }
}, {
  timestamps: true
});

// Add pre-save hook to update timestamps
patientSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient; 