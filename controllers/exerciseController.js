import Exercise from '../model/Exercise.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create new exercise
export const createExercise = async (req, res) => {
  try {
    const { name, description, instructions, targetArea, difficulty, recommendedSets, recommendedReps } = req.body;
    const mediaFile = req.files?.media;

    if (!mediaFile) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    // Upload media to Cloudinary
    const result = await cloudinary.uploader.upload(mediaFile.tempFilePath, {
      resource_type: 'auto',
      folder: 'physiome/exercises'
    });

    const exercise = await Exercise.create({
      name,
      description,
      mediaUrl: result.secure_url,
      mediaType: result.resource_type === 'video' ? 'video' : 'image',
      instructions: instructions || [],
      targetArea,
      difficulty,
      recommendedSets,
      recommendedReps,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Create exercise for treatment plan (without file upload)
export const createExerciseForTreatmentPlan = async (req, res) => {
  try {
    const { name, description, instructions, targetArea, difficulty, recommendedSets, recommendedReps, mediaUrl, mediaType } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }

    const exercise = await Exercise.create({
      name,
      description,
      mediaUrl: mediaUrl || 'https://via.placeholder.com/400x300?text=Exercise+Video',
      mediaType: mediaType || 'image',
      instructions: Array.isArray(instructions) ? instructions : [instructions || description],
      targetArea: targetArea || 'General',
      difficulty: difficulty || 'beginner',
      recommendedSets: recommendedSets || 3,
      recommendedReps: recommendedReps || 10,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all exercises (with filters)
export const getExercises = async (req, res) => {
  try {
    const { targetArea, difficulty, search } = req.query;
    const query = {};

    if (targetArea) query.targetArea = targetArea;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const exercises = await Exercise.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: exercises
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get exercise by ID
export const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update exercise
export const updateExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Verify ownership
    if (exercise.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this exercise' });
    }

    // Handle media update if provided
    if (req.files?.media) {
      const result = await cloudinary.uploader.upload(req.files.media.tempFilePath, {
        resource_type: 'auto',
        folder: 'physiome/exercises'
      });

      req.body.mediaUrl = result.secure_url;
      req.body.mediaType = result.resource_type === 'video' ? 'video' : 'image';

      // Delete old media from Cloudinary
      const oldMediaId = exercise.mediaUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(oldMediaId);
    }

    Object.assign(exercise, req.body);
    await exercise.save();

    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete exercise
export const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Verify ownership
    if (exercise.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this exercise' });
    }

    // Delete media from Cloudinary
    const mediaId = exercise.mediaUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(mediaId);

    await exercise.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};