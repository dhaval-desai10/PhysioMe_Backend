import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
};

// Send contact form email
export const sendContactEmail = async (contactData) => {
    try {
        const transporter = createTransporter();

        const { firstName, lastName, email, phone, subject, message } = contactData;

        // Email to admin/support
        const adminMailOptions = {
            from: process.env.MAIL_FROM,
            to: process.env.MAIL_FROM, // Send to the admin email
            subject: `Contact Form: ${subject}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Message</h3>
            <p style="line-height: 1.6; color: #475569;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f1f5f9; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">
              This email was sent from the PhysioMe contact form. Please respond directly to ${email}.
            </p>
          </div>
        </div>
      `,
        };

        // Confirmation email to user
        const userMailOptions = {
            from: process.env.MAIL_FROM,
            to: email,
            subject: 'Thank you for contacting PhysioMe',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            Thank you for contacting us!
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hi ${firstName},</p>
            <p>Thank you for reaching out to PhysioMe. We have received your message and will get back to you within 24 hours.</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Your Message Summary</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="line-height: 1.6; color: #475569;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 30px;">
            <p>If you have any urgent concerns, please call us directly at <strong>+1 (555) 123-4567</strong>.</p>
            <p>Best regards,<br>The PhysioMe Team</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f1f5f9; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">
              This is an automated response. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
        };

        // Send both emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

        return {
            success: true,
            message: 'Emails sent successfully',
        };
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
    }
};

// Test email connection
export const testEmailConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        return { success: true, message: 'Email connection verified' };
    } catch (error) {
        console.error('Email connection test failed:', error);
        return { success: false, message: 'Email connection failed', error: error.message };
    }
};
