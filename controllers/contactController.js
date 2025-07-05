import { sendContactEmail, testEmailConnection } from '../utils/emailService.js';

// @desc    Send contact form email
// @route   POST /api/contact
// @access  Public
export const sendContactForm = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: firstName, lastName, email, subject, and message',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
            });
        }

        // Prepare contact data
        const contactData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            subject: subject.trim(),
            message: message.trim(),
        };

        // Send email
        await sendContactEmail(contactData);

        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send your message. Please try again later or contact us directly.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// @desc    Test email connection
// @route   GET /api/contact/test
// @access  Public (for development only)
export const testEmail = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                message: 'This endpoint is only available in development mode',
            });
        }

        const result = await testEmailConnection();

        res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message,
        });
    }
};
