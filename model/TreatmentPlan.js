import mongoose from 'mongoose';

const treatmentPlanSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  physiotherapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  goals: [{
    type: String,
    required: true
  }],
  exercises: [{
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    sets: {
      type: Number,
      required: true
    },
    reps: {
      type: Number,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    notes: String
  }],
  duration: {
    type: Number, // Duration in weeks
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TreatmentPlan = mongoose.model('TreatmentPlan', treatmentPlanSchema);

export default TreatmentPlan;

