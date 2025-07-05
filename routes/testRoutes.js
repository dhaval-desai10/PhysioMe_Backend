// Test route for therapist profile update without conflicts
import express from 'express';
import User from '../model/User.js';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../utils/multer.js';

const router = express.Router();

// Simple test route for profile update
router.put('/test-profile/:id', verifyToken, upload, async (req, res) => {
    try {
        console.log('=== TEST PROFILE UPDATE ===');
        console.log('req.body:', req.body);
        console.log('req.file:', req.file ? 'File present' : 'No file');
        console.log('Body keys:', req.body ? Object.keys(req.body) : 'No body');

        const therapistId = req.params.id;

        if (!req.body && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'No data received',
                debug: {
                    body: req.body,
                    file: req.file,
                    contentType: req.headers['content-type']
                }
            });
        }

        // Find therapist
        const therapist = await User.findById(therapistId);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                message: 'Therapist not found'
            });
        }

        // Simple update with only the name field for testing
        const updateData = {};
        if (req.body && req.body.name) {
            updateData.name = req.body.name;
        }

        console.log('Update data:', updateData);

        if (Object.keys(updateData).length > 0) {
            await User.findByIdAndUpdate(therapistId, updateData);
        }

        res.json({
            success: true,
            message: 'Test update successful',
            received: {
                body: req.body,
                file: req.file ? req.file.originalname : null,
                updateData
            }
        });

    } catch (error) {
        console.error('Test update error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
