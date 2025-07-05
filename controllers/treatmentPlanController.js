import TreatmentPlan from '../model/TreatmentPlan.js';
import User from '../model/User.js';

// Create new treatment plan
export const createTreatmentPlan = async (req, res) => {
  try {
    const { patientId, title, description, goals, duration, exercises } = req.body;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create treatment plan
    const treatmentPlan = await TreatmentPlan.create({
      patientId,
      physiotherapistId: req.user._id,
      title,
      description,
      goals,
      duration,
      exercises: exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        frequency: ex.frequency,
        notes: ex.notes
      }))
    });

    // Populate exercise details
    await treatmentPlan.populate('exercises.exerciseId', 'name description mediaUrl');
    await treatmentPlan.populate('physiotherapistId', 'name email');

    console.log('Treatment plan created successfully for patient:', patient.name);

    res.status(201).json({
      success: true,
      data: treatmentPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all treatment plans (filtered by role)
export const getTreatmentPlans = async (req, res) => {
  try {
    const query = {};

    // Filter based on user role
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'physiotherapist') {
      query.physiotherapistId = req.user._id;
    }

    const treatmentPlans = await TreatmentPlan.find(query)
      .populate('patientId', 'name email')
      .populate('physiotherapistId', 'name email')
      .populate('exercises.exerciseId', 'name description mediaUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: treatmentPlans
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get treatment plan by ID
export const getTreatmentPlanById = async (req, res) => {
  try {
    const treatmentPlan = await TreatmentPlan.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('physiotherapistId', 'name email')
      .populate('exercises.exerciseId', 'name description mediaUrl');

    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    // Verify access rights
    if (req.user.role === 'patient' && treatmentPlan.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this treatment plan' });
    }
    if (req.user.role === 'physiotherapist' && treatmentPlan.physiotherapistId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this treatment plan' });
    }

    res.status(200).json({
      success: true,
      data: treatmentPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update treatment plan
export const updateTreatmentPlan = async (req, res) => {
  try {
    const treatmentPlan = await TreatmentPlan.findById(req.params.id);
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    // Verify ownership
    if (treatmentPlan.physiotherapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this treatment plan' });
    }

    // Update fields
    const { title, description, goals, duration, exercises, status } = req.body;

    if (title) treatmentPlan.title = title;
    if (description) treatmentPlan.description = description;
    if (goals) treatmentPlan.goals = goals;
    if (duration) treatmentPlan.duration = duration;
    if (exercises) {
      treatmentPlan.exercises = exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        frequency: ex.frequency,
        notes: ex.notes
      }));
    }
    if (status) treatmentPlan.status = status;

    await treatmentPlan.save();

    // Populate updated plan
    await treatmentPlan.populate('exercises.exerciseId', 'name description mediaUrl');
    await treatmentPlan.populate('physiotherapistId', 'name email');
    await treatmentPlan.populate('patientId', 'name email');

    res.status(200).json({
      success: true,
      data: treatmentPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete treatment plan
export const deleteTreatmentPlan = async (req, res) => {
  try {
    const treatmentPlan = await TreatmentPlan.findById(req.params.id);
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    // Verify ownership
    if (treatmentPlan.physiotherapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this treatment plan' });
    }

    await treatmentPlan.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Treatment plan deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get treatment plans for a specific patient (for therapists)
export const getPatientTreatmentPlans = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify that the requesting user is a therapist
    if (req.user.role !== 'physiotherapist') {
      return res.status(403).json({
        success: false,
        message: 'Only therapists can access patient treatment plans'
      });
    }

    const treatmentPlans = await TreatmentPlan.find({
      patientId: patientId,
      physiotherapistId: req.user._id // Only get plans created by this therapist
    })
      .populate('patientId', 'name email')
      .populate('physiotherapistId', 'name email')
      .populate('exercises.exerciseId', 'name description mediaUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: treatmentPlans
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};