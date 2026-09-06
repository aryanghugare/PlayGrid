// Will be used for file uploads 
import multer from "multer"
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ApiError } from "../utils/ApiError.js";
const tempDirectory = path.join(tmpdir(), "playgrid-uploads");
mkdirSync(tempDirectory, { recursive: true });


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDirectory)
    },
    filename: function (req, file, cb) {
        // So this file.originalname is the name by which user has uploaded the file 
        // You can add more security to it , 7:39:10
        // This is simple but not always secure, since two users uploading files with the same name could overwrite each other’s files.
        // That’s why many apps use Date.now() or UUIDs to generate unique names
// Look at the docs of the multer to see how the originalname can be changed 
        cb(null, randomUUID())
    }
})
// This storage method returns the file Name 
export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 2, fields: 10 },
    fileFilter(req, file, cb) {
        const valid = /^image\/(jpeg|png|webp)$/.test(file.mimetype);
        cb(valid ? null : new ApiError(400, "Use JPEG, PNG or WebP images"), valid);
    }
})



// The complete flow of file uploads in this project 

/*
Frontend → sends file via form/API
Multer → saves file locally (public/temp/avatar-123.jpg)
Your Controller → calls uploadOnCloudinary(req.file.path)
Cloudinary → uploads file to cloud, returns URL
Cleanup → local file deleted via fs.unlinkSync()
Database → save Cloudinary URL in user profile


*/


// This is achieved using two files multer.middleware.js and cloudinary.js

// Video uploads use a separate limit; the image controller retains its existing middleware.
export const videoUpload = multer({
    storage,
    limits: { fileSize: 250 * 1024 * 1024, files: 2, fields: 10 },
    fileFilter(req, file, cb) {
        const valid = file.fieldname === "video" ? /^video\/(mp4|webm)$/.test(file.mimetype) : file.fieldname === "thumbnail" && /^image\/(jpeg|png|webp)$/.test(file.mimetype);
        cb(valid ? null : new ApiError(400, "Use MP4/WebM video and JPEG/PNG/WebP images"), valid);
    }
});

// Cleanup also runs when validation fails after Multer has saved a temporary file.
export function cleanupUploads(req, res, next) {
    res.once("finish", () => {
        const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
        for (const file of files) unlink(file.path).catch(() => {});
    });
    next();
}
