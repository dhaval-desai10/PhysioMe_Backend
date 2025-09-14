import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  const config = {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    // Add these options for better production reliability
    tls: {
      rejectUnauthorized: false
    }
  };

  // Log configuration for debugging (without exposing sensitive data)
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Email Config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user ? 'SET' : 'NOT_SET',
      pass: config.auth.pass ? 'SET' : 'NOT_SET'
    });
  }

  return nodemailer.createTransport(config);
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
    console.log('📧 Sending contact form emails...');
    await transporter.sendMail(adminMailOptions);
    console.log('✅ Admin email sent successfully');

    await transporter.sendMail(userMailOptions);
    console.log('✅ User confirmation email sent successfully');

    return {
      success: true,
      message: 'Contact emails sent successfully',
    };
  } catch (error) {
    console.error('❌ Email sending error:', error.message);

    // Log specific error details for debugging
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.response) {
      console.error('SMTP response:', error.response);
    }

    throw new Error(`Failed to send contact email: ${error.message}`);
  }
};

// Send appointment booking confirmation emails
export const sendAppointmentBookingEmails = async (appointmentData) => {
  try {
    const transporter = createTransporter();

    const {
      appointment,
      patient,
      therapist,
      appointmentDate,
      appointmentTime,
      visitType
    } = appointmentData;

    // Format date for display
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Email to Patient
    const patientMailOptions = {
      from: process.env.MAIL_FROM,
      to: patient.email,
      subject: 'Appointment Booking Confirmation - PhysioMe',
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">PhysioMe</h1>
                        <p style="color: #64748b; margin: 5px 0;">Your Health, Our Priority</p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 0;">
                            ✅ Appointment Booked Successfully!
                        </h2>
                        
                        <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
                            Dear <strong>${patient.name}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                            Your appointment has been successfully booked with PhysioMe. Here are your appointment details:
                        </p>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
                            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">📅 Appointment Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Therapist:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${therapist.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Date:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Time:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${appointmentTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Visit Type:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${visitType === 'home' ? 'Home Visit' : 'Clinic Visit'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Status:</td>
                                    <td style="padding: 8px 0; color: #f59e0b; font-weight: bold;">Pending Confirmation</td>
                                </tr>
                            </table>
                        </div>
                        
                        ${appointment.notes ? `
                        <div style="background-color: #fefce8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">📝 Additional Notes:</h4>
                            <p style="color: #92400e; margin: 0; line-height: 1.5;">${appointment.notes}</p>
                        </div>
                        ` : ''}
                        
                        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="color: #065f46; margin-top: 0; margin-bottom: 15px;">📋 What's Next?</h3>
                            <ul style="color: #065f46; line-height: 1.8; padding-left: 20px;">
                                <li>Your therapist will confirm your appointment within 24 hours</li>
                                <li>You'll receive a confirmation email once approved</li>
                                <li>Please arrive 10 minutes early for your appointment</li>
                                <li>Bring any relevant medical documents or reports</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="color: #64748b; margin-bottom: 15px;">Need to reschedule or have questions?</p>
                            <a href="mailto:${process.env.MAIL_FROM}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Contact Support</a>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
                        <p>This is an automated email from PhysioMe. Please do not reply directly to this email.</p>
                        <p>© 2025 PhysioMe. All rights reserved.</p>
                    </div>
                </div>
            `,
    };

    // Email to Therapist
    const therapistMailOptions = {
      from: process.env.MAIL_FROM,
      to: therapist.email,
      subject: 'New Appointment Booking - Action Required',
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">PhysioMe</h1>
                        <p style="color: #64748b; margin: 5px 0;">Professional Physiotherapy Platform</p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; margin-top: 0;">
                            🔔 New Appointment Request
                        </h2>
                        
                        <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
                            Dear <strong>Dr. ${therapist.name}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                            You have received a new appointment booking request. Please review and confirm the appointment details below:
                        </p>
                        
                        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
                            <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">👤 Patient Information</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Patient Name:</td>
                                    <td style="padding: 8px 0; color: #451a03;">${patient.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Email:</td>
                                    <td style="padding: 8px 0; color: #451a03;">${patient.email}</td>
                                </tr>
                                ${patient.phone ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Phone:</td>
                                    <td style="padding: 8px 0; color: #451a03;">${patient.phone}</td>
                                </tr>
                                ` : ''}
                            </table>
                        </div>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
                            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">📅 Appointment Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Date:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Time:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${appointmentTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Visit Type:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${visitType === 'home' ? 'Home Visit' : 'Clinic Visit'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Appointment Type:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${appointment.type || 'Initial Consultation'}</td>
                                </tr>
                            </table>
                        </div>
                        
                        ${appointment.notes ? `
                        <div style="background-color: #fefce8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">📝 Patient Notes:</h4>
                            <p style="color: #92400e; margin: 0; line-height: 1.5;">${appointment.notes}</p>
                        </div>
                        ` : ''}
                        
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 15px;">⏰ Action Required</h3>
                            <p style="color: #dc2626; line-height: 1.6; margin-bottom: 15px;">
                                Please log in to your dashboard to confirm or modify this appointment. The patient is waiting for your confirmation.
                            </p>
                            <ul style="color: #dc2626; line-height: 1.8; padding-left: 20px;">
                                <li>Review the appointment details carefully</li>
                                <li>Confirm availability for the requested time slot</li>
                                <li>Update appointment status (Confirm/Reschedule)</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/therapist/appointments" 
                               style="display: inline-block; background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                                Manage Appointments
                            </a>
                            <a href="mailto:${patient.email}" 
                               style="display: inline-block; background-color: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Contact Patient
                            </a>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
                        <p>This is an automated notification from PhysioMe.</p>
                        <p>© 2025 PhysioMe. All rights reserved.</p>
                    </div>
                </div>
            `,
    };

    // Send both emails
    console.log('Sending appointment booking emails...');
    console.log('Patient email:', patient.email);
    console.log('Therapist email:', therapist.email);

    await transporter.sendMail(patientMailOptions);
    console.log('✅ Patient notification email sent successfully');

    await transporter.sendMail(therapistMailOptions);
    console.log('✅ Therapist notification email sent successfully');

    return {
      success: true,
      message: 'Appointment booking emails sent successfully',
      recipients: [patient.email, therapist.email]
    };
  } catch (error) {
    console.error('❌ Error sending appointment booking emails:', error);
    throw new Error(`Failed to send appointment booking emails: ${error.message}`);
  }
};

// Send appointment status update emails
export const sendAppointmentStatusUpdateEmails = async (appointmentData) => {
  try {
    const transporter = createTransporter();

    const {
      appointment,
      patient,
      therapist,
      appointmentDate,
      appointmentTime,
      visitType,
      status,
      previousStatus
    } = appointmentData;

    // Format date for display
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get status display info
    const getStatusInfo = (status) => {
      switch (status) {
        case 'confirmed':
          return { color: '#10b981', icon: '✅', text: 'Confirmed' };
        case 'cancelled':
          return { color: '#ef4444', icon: '❌', text: 'Cancelled' };
        case 'completed':
          return { color: '#3b82f6', icon: '🏁', text: 'Completed' };
        case 'pending':
          return { color: '#f59e0b', icon: '⏳', text: 'Pending' };
        default:
          return { color: '#64748b', icon: '📋', text: status };
      }
    };

    const statusInfo = getStatusInfo(status);

    // Email to Patient
    const patientMailOptions = {
      from: process.env.MAIL_FROM,
      to: patient.email,
      subject: `Appointment ${statusInfo.text} - PhysioMe`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">PhysioMe</h1>
                        <p style="color: #64748b; margin: 5px 0;">Your Health, Our Priority</p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: ${statusInfo.color}; border-bottom: 2px solid ${statusInfo.color}; padding-bottom: 10px; margin-top: 0;">
                            ${statusInfo.icon} Appointment ${statusInfo.text}
                        </h2>
                        
                        <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
                            Dear <strong>${patient.name}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                            Your appointment status has been updated. Here are the current details:
                        </p>
                        
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
                            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">📅 Appointment Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Therapist:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${therapist.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Date:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Time:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${appointmentTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Visit Type:</td>
                                    <td style="padding: 8px 0; color: #1e293b;">${visitType === 'home' ? 'Home Visit' : 'Clinic Visit'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Status:</td>
                                    <td style="padding: 8px 0; color: ${statusInfo.color}; font-weight: bold;">${statusInfo.icon} ${statusInfo.text}</td>
                                </tr>
                            </table>
                        </div>
                        
                        ${status === 'confirmed' ? `
                        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="color: #065f46; margin-top: 0; margin-bottom: 15px;">🎉 Great News!</h3>
                            <p style="color: #065f46; line-height: 1.6;">
                                Your appointment has been confirmed by ${therapist.name}. Please arrive 10 minutes early and bring any relevant medical documents.
                            </p>
                        </div>
                        ` : ''}
                        
                        ${status === 'cancelled' ? `
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 15px;">⚠️ Appointment Cancelled</h3>
                            <p style="color: #dc2626; line-height: 1.6;">
                                Unfortunately, this appointment has been cancelled. Please contact us to reschedule or if you have any questions.
                            </p>
                        </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="color: #64748b; margin-bottom: 15px;">Need assistance or have questions?</p>
                            <a href="mailto:${process.env.MAIL_FROM}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Contact Support</a>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
                        <p>This is an automated notification from PhysioMe.</p>
                        <p>© 2025 PhysioMe. All rights reserved.</p>
                    </div>
                </div>
            `,
    };

    // Send email to patient
    console.log(`Sending ${status} notification to patient: ${patient.email}`);
    await transporter.sendMail(patientMailOptions);
    console.log('✅ Patient status update email sent successfully');

    return {
      success: true,
      message: `Appointment ${status} notification sent successfully`,
      recipient: patient.email
    };
  } catch (error) {
    console.error('❌ Error sending appointment status update emails:', error);
    throw new Error(`Failed to send appointment status update emails: ${error.message}`);
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    console.log('🔍 Testing email connection...');
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email connection verified');
    return { success: true, message: 'Email connection verified' };
  } catch (error) {
    console.error('❌ Email connection test failed:', error.message);
    return { success: false, message: 'Email connection failed', error: error.message };
  }
};

// Test sending a simple email (for debugging)
export const sendTestEmail = async (toEmail = process.env.MAIL_FROM) => {
  try {
    console.log('🔍 Sending test email to:', toEmail);
    const transporter = createTransporter();

    const testMailOptions = {
      from: process.env.MAIL_FROM,
      to: toEmail,
      subject: '🧪 PhysioMe Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">✅ Email Test Successful</h2>
          <p>This is a test email from PhysioMe backend.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <p>If you received this email, your email configuration is working! 🎉</p>
        </div>
      `,
    };

    await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully');
    return { success: true, message: 'Test email sent successfully', recipient: toEmail };
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    return { success: false, message: 'Test email failed', error: error.message };
  }
};
