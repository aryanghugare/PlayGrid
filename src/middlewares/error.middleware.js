import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import multer from "multer";


const errorHandler = (err,req,res,next) => {
if (res.headersSent) return next(err);
let error = err ; 
if(!(error instanceof ApiError)) {
const statusCode = error.code === 11000 ? 409 : error.code === "LIMIT_FILE_SIZE" || error.type === "entity.too.large" ? 413 : error instanceof mongoose.Error || error instanceof multer.MulterError || error.type === "entity.parse.failed" ? 400 : 500

const message = statusCode === 500 ? "An unexpected error occurred" : error.code === 11000 ? "This record already exists" : error.type === "entity.parse.failed" ? "Invalid JSON body" : statusCode === 413 ? "Upload or request is too large" : "Invalid request data"
error = new ApiError(statusCode,message,error?.errors || [], err.stack)
}

const response = {
statusCode: error.statusCode, data: null, success: false, errors: Array.isArray(error.errors) ? error.errors : [],
message : error.message ,
...(process.env.NODE_ENV === "development" ? { stack : error.stack } : {})

}

return res.status(error.statusCode).json(response)
}


export {errorHandler}