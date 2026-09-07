import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

import express from "express"
import dotenv from "dotenv";
dotenv.config();
const app = express();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE || DB_NAME, autoIndex: process.env.NODE_ENV !== "production", serverSelectionTimeoutMS: 10000 })
        // Through mongoose.connect , there is object returned of connection 
        //  console.log("Connected Succesfully", connectionInstance.connection)
        console.log("Connected Succesfully database")


    } catch (error) {
        console.log("MONGODB Connection error of db", error);
        process.exit(1)

    }
}

export default connectDB