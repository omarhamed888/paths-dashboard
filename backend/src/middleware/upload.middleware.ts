import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer configuration for file uploads
 * Stores files with UUID names to prevent conflicts
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

/**
 * File filter for allowed extensions
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || 'pdf,zip,docx,doc,txt,jpg,png,jpeg')
        .split(',')
        .map(ext => ext.trim().toLowerCase());

    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);

    if (allowedExtensions.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new Error(`File type .${fileExt} not allowed. Allowed types: ${allowedExtensions.join(', ')}`));
    }
};

/**
 * Multer upload middleware
 */
export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // Default 10MB
    },
});
