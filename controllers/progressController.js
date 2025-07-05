import Progress from '../model/Progress.js';
import TreatmentPlan from '../model/TreatmentPlan.js';
import cloudinary from '../utils/cloudinary.js';

// Create new progress record
export const createProgress = async (req, res) => {
  try {
    const { treatmentPlanId, notes, painLevel, mobility, strength } = req.body;
    const mediaFile = req.files?.media;

    // Verify treatment plan exists and belongs to user
    const treatmentPlan = await TreatmentPlan.findById(treatmentPlanId);
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    if (treatmentPlan.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add progress to this treatment plan' });
    }

    let mediaUrl = null;
    let mediaType = null;

    // Upload media if provided
    if (mediaFile) {
      const result = await cloudinary.uploader.upload(mediaFile.tempFilePath, {
        resource_type: 'auto',
        folder: 'physiome/progress'
      });
      mediaUrl = result.secure_url;
      mediaType = result.resource_type === 'video' ? 'video' : 'image';
    }

    const progress = await Progress.create({
      treatmentPlanId,
      patientId: req.user._id,
      notes,
      painLevel,
      mobility,
      strength,
      mediaUrl,
      mediaType
    });

    console.log('Progress record created successfully');

    res.status(201).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress records for a treatment plan
export const getProgressByTreatmentPlan = async (req, res) => {
  try {
    const { treatmentPlanId } = req.params;

    // Verify treatment plan exists and belongs to user
    const treatmentPlan = await TreatmentPlan.findById(treatmentPlanId);
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    // Allow both patient and physiotherapist to view progress
    if (treatmentPlan.patientId.toString() !== req.user._id.toString() &&
      treatmentPlan.physiotherapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this treatment plan\'s progress' });
    }

    const progress = await Progress.find({ treatmentPlanId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update progress record
export const updateProgress = async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Verify ownership
    if (progress.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this progress record' });
    }

    // Handle media update if provided
    if (req.files?.media) {
      const result = await cloudinary.uploader.upload(req.files.media.tempFilePath, {
        resource_type: 'auto',
        folder: 'physiome/progress'
      });

      // Delete old media if exists
      if (progress.mediaUrl) {
        const oldMediaId = progress.mediaUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(oldMediaId);
      }

      progress.mediaUrl = result.secure_url;
      progress.mediaType = result.resource_type === 'video' ? 'video' : 'image';
    }

    // Update other fields
    const { notes, painLevel, mobility, strength } = req.body;
    if (notes) progress.notes = notes;
    if (painLevel) progress.painLevel = painLevel;
    if (mobility) progress.mobility = mobility;
    if (strength) progress.strength = strength;

    await progress.save();

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete progress record
export const deleteProgress = async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Verify ownership
    if (progress.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this progress record' });
    }

    // Delete media from Cloudinary if exists
    if (progress.mediaUrl) {
      const mediaId = progress.mediaUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(mediaId);
    }

    await progress.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Progress record deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress record by ID
export const getProgressById = async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Verify ownership or if user is the physiotherapist
    const treatmentPlan = await TreatmentPlan.findById(progress.treatmentPlanId);
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Associated treatment plan not found' });
    }

    if (progress.patientId.toString() !== req.user._id.toString() &&
      treatmentPlan.physiotherapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this progress record' });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress history for current user
export const getProgressHistory = async (req, res) => {
  try {
    const progress = await Progress.find({ patientId: req.user._id })
      .populate('treatmentPlanId', 'title description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress records for a specific patient (therapist access)
export const getPatientProgress = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify the therapist has access to this patient
    const treatmentPlans = await TreatmentPlan.find({
      patientId,
      physiotherapistId: req.user._id
    });

    if (treatmentPlans.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view this patient\'s progress' });
    }

    const progress = await Progress.find({ patientId })
      .populate('treatmentPlanId', 'title description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress statistics for a treatment plan
export const getProgressStats = async (req, res) => {
  try {
    const { treatmentPlanId } = req.params;

    // Verify treatment plan exists and user has access
    const treatmentPlan = await TreatmentPlan.findById(treatmentPlanId);
    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    if (treatmentPlan.patientId.toString() !== req.user._id.toString() &&
      treatmentPlan.physiotherapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this treatment plan\'s progress' });
    }

    const progress = await Progress.find({ treatmentPlanId }).sort({ createdAt: 1 });

    // Calculate statistics
    const stats = {
      totalEntries: progress.length,
      averagePainLevel: progress.length > 0 ? progress.reduce((sum, p) => sum + p.painLevel, 0) / progress.length : 0,
      averageMobility: progress.length > 0 ? progress.reduce((sum, p) => sum + p.mobility, 0) / progress.length : 0,
      averageStrength: progress.length > 0 ? progress.reduce((sum, p) => sum + p.strength, 0) / progress.length : 0,
      progressTrend: {
        painLevel: progress.length >= 2 ? progress[0].painLevel - progress[progress.length - 1].painLevel : 0,
        mobility: progress.length >= 2 ? progress[progress.length - 1].mobility - progress[0].mobility : 0,
        strength: progress.length >= 2 ? progress[progress.length - 1].strength - progress[0].strength : 0
      },
      recentEntries: progress.slice(-5)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress summary for a patient (therapist access)
export const getProgressSummary = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify the therapist has access to this patient
    const treatmentPlans = await TreatmentPlan.find({
      patientId,
      physiotherapistId: req.user._id
    });

    if (treatmentPlans.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view this patient\'s progress' });
    }

    const progress = await Progress.find({ patientId }).sort({ createdAt: 1 });

    const summary = {
      totalSessions: progress.length,
      dateRange: progress.length > 0 ? {
        start: progress[0].createdAt,
        end: progress[progress.length - 1].createdAt
      } : null,
      averageScores: {
        painLevel: progress.length > 0 ? progress.reduce((sum, p) => sum + p.painLevel, 0) / progress.length : 0,
        mobility: progress.length > 0 ? progress.reduce((sum, p) => sum + p.mobility, 0) / progress.length : 0,
        strength: progress.length > 0 ? progress.reduce((sum, p) => sum + p.strength, 0) / progress.length : 0
      },
      improvement: progress.length >= 2 ? {
        painReduction: progress[0].painLevel - progress[progress.length - 1].painLevel,
        mobilityIncrease: progress[progress.length - 1].mobility - progress[0].mobility,
        strengthIncrease: progress[progress.length - 1].strength - progress[0].strength
      } : null,
      treatmentPlans: treatmentPlans.length,
      latestEntry: progress.length > 0 ? progress[progress.length - 1] : null
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};