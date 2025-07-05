import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with explicit settings
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const uploadToCloudinary = async (filePath) => {
    try {
      

        // Simple upload without extra parameters that might cause signature issues
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'physiome'
        });


        return result;
    } catch (error) {
        console.error('Cloudinary upload detailed error:', {
            message: error.message,
            stack: error.stack,
            http_code: error.http_code
        });
        throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
    }
};

// Add default export
export default cloudinary;