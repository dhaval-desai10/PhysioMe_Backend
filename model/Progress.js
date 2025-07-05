import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  treatmentPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentPlan',
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  painLevel: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },
  mobility: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  strength: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  mediaUrl: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'video']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;