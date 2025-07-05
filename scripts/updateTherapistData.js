import mongoose from 'mongoose';
import User from '../model/User.js';
import dotenv from 'dotenv';

dotenv.config();

const updateTherapistData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all therapists
    const therapists = await User.find({ role: 'physiotherapist' });
    
    // Update each therapist
    for (const therapist of therapists) {
      // If licenseNumber contains address, move it to clinicAddress
      if (therapist.licenseNumber && therapist.licenseNumber.includes('Ahmedabad')) {
        therapist.clinicAddress = therapist.licenseNumber;
        therapist.licenseNumber = 'PENDING'; // Set a default value
      }

      // Set default values for missing fields
      if (!therapist.clinicName) {
        therapist.clinicName = 'My Clinic';
      }
      if (!therapist.clinicAddress) {
        therapist.clinicAddress = 'Address not provided';
      }
      if (!therapist.phone) {
        therapist.phone = '+919876543210'; // Default Indian phone number format
      }
      if (!therapist.workingHours) {
        therapist.workingHours = {
          start: '09:00',
          end: '17:00'
        };
      }
      if (!therapist.workingDays) {
        therapist.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      }

      // Save the updated therapist
      await therapist.save();
    }

  } catch (error) {
    console.error('Error updating therapists:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the update
updateTherapistData(); 