// Test route for therapist profile update without conflicts
import express from 'express';
import User from '../model/User.js';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../utils/multer.js';
import { testEmailConnection, sendTestEmail } from '../utils/emailService.js';

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

// Test email connection
router.get('/email-connection', async (req, res) => {
    try {
        console.log('🔍 Testing email connection...');
        const result = await testEmailConnection();

        res.status(result.success ? 200 : 500).json({
            success: result.success,
            message: result.message,
            error: result.error || null,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('❌ Email connection test error:', error);
        res.status(500).json({
            success: false,
            message: 'Email connection test failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Test sending email
router.post('/send-email', async (req, res) => {
    try {
        const { email } = req.body;
        const testEmail = email || process.env.MAIL_FROM;

        console.log('🔍 Testing email sending to:', testEmail);
        const result = await sendTestEmail(testEmail);

        res.status(result.success ? 200 : 500).json({
            success: result.success,
            message: result.message,
            recipient: result.recipient || null,
            error: result.error || null,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('❌ Email sending test error:', error);
        res.status(500).json({
            success: false,
            message: 'Email sending test failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Check email configuration (without exposing sensitive data)
router.get('/email-config', (req, res) => {
    try {
        console.log('📧 Checking email configuration...');

        const config = {
            MAIL_HOST: process.env.MAIL_HOST || 'NOT_SET',
            MAIL_PORT: process.env.MAIL_PORT || 'NOT_SET',
            MAIL_SECURE: process.env.MAIL_SECURE || 'NOT_SET',
            MAIL_USER: process.env.MAIL_USER ? `${process.env.MAIL_USER.substring(0, 3)}***@${process.env.MAIL_USER.split('@')[1]}` : 'NOT_SET',
            MAIL_PASS: process.env.MAIL_PASS ? 'SET (hidden)' : 'NOT_SET',
            MAIL_FROM: process.env.MAIL_FROM || 'NOT_SET',
            NODE_ENV: process.env.NODE_ENV || 'development'
        };

        console.log('📧 Email config check:', config);

        res.status(200).json({
            success: true,
            message: 'Email configuration retrieved',
            config,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Email config check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check email configuration',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
