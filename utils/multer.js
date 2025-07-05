import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter for image files only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Create multer instance
const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});


export const upload = (req, res, next) => {

    // Use multer middleware - this will handle both file and form data
    const multerSingle = uploadMiddleware.single('profilePicture');

    multerSingle(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);

            // Don't fail the entire request for multer errors unless it's critical
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 5MB.'
                    });
                } else if (err.code === 'UNEXPECTED_FIELD') {
                    console.warn('Unexpected field in multer, continuing...');
                } else {
                    return res.status(400).json({
                        success: false,
                        message: err.message || 'File upload error'
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload error'
                });
            }
        }
        next();
    });
};

// Middleware to log form data and ensure req.body exists
export const logFormData = (req, res, next) => {
   
    // Ensure req.body exists and is an object
    if (!req.body || typeof req.body !== 'object') {
        req.body = {};
        console.warn('Created empty req.body object');
    }

    // Parse JSON strings in req.body if needed
    try {
        // Safely handle workingHours if it's a string
        if (req.body.workingHours && typeof req.body.workingHours === 'string') {
            try {
                req.body.workingHours = JSON.parse(req.body.workingHours);
            } catch (e) {
                console.error('Failed to parse workingHours:', e);
            }
        }

        // Safely handle workingDays if it's a string
        if (req.body.workingDays && typeof req.body.workingDays === 'string') {
            try {
                req.body.workingDays = JSON.parse(req.body.workingDays);
            } catch (e) {
                console.error('Failed to parse workingDays:', e);
            }
        }
    } catch (error) {
        console.error('Error processing req.body:', error);
    }

    next();
};