import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { allowedOrigins, browserWriteGuard, rateLimit } from "./middlewares/security.middleware.js";
import { cleanupUploads } from "./middlewares/multer.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";
import { ApiResponse } from "./utils/ApiResponses.js";
import { mediaDirectory } from "./services/media.js";
import { optionalJWT } from "./middlewares/auth.middleware.js";
import { visibleVideos } from "./services/videos.js";
import { Video } from "./models/video.model.js";
const app = express()
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use((req, res, next) => { res.set("X-Content-Type-Options", "nosniff"); next(); });
// app.use() is the middleware 
// To handle the cross origin resource sharing 
app.use(cors({
    origin(origin, cb) { cb(null, !origin || allowedOrigins().includes(origin) || origin === process.env.APP_ORIGIN); },
    credentials: true
    // many options to explore 
}))

app.use(browserWriteGuard);
app.use(cleanupUploads);
app.use("/api", rateLimit({ limit: 1000 }));

// To handle all type of data 
// To accept the json files 
// To set the limit for json reponses 
app.use(express.json({ limit: "20kb" }))
// To handle the URL 
app.use(express.urlencoded())
// app.use(express.urlencoded({ extended: true }));

// To handle the public assets , which i want to store in my system 
// express.static() is built-in middleware in Express.
// It’s used to serve static files (files that don’t change on the server).
// Example static files: HTML, CSS, JavaScript, images, fonts, PDFs.
app.use(express.static("public"))

// To do the CRUD operation on the cookies 
app.use(cookieParser())
// Normalize missing bodies so required-field validation returns a useful 400.
app.use((req, res, next) => {
    if (req.body === undefined) req.body = {};
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return next(new ApiError(400, "Request body must be an object"));
    next();
});


// routes import 
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import healthcheckRouter from './routes/healthcheck.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'

import videoRouter from "./routes/video.routes.js";
import { commentRouter, likeRouter, playlistRouter } from "./routes/engagement.routes.js";

// routes declaration 
// Through this middleware 
//what we are doing is , whenever a user enters "/users"
// The controll will go to the  'userRouter'
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
// so we have created till here 
// after that controll is passed to userRouter in file user.routes.js
// http://localhost:8000/api/v1/users/ 

// This is newly added routing , which is a new addition 
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/dashboard", dashboardRouter)

// Added resource APIs keep the original routes above available.
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);
app.get("/api/v1/healthcheck/ready", (req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json(new ApiResponse(ready ? 200 : 503, { database: ready ? "connected" : "unavailable" }));
});
if (process.env.MEDIA_DRIVER === "local") {
    app.use("/media", optionalJWT, async (req, res, next) => {
        // Draft local videos follow the same access policy as their detail endpoint.
        if (/\.(mp4|webm)$/i.test(req.path)) {
            const video = await Video.exists({ videoPublicId: `local:${path.basename(req.path)}`, ...visibleVideos(req.user) });
            if (!video) return next(new ApiError(404, "Video not found"));
        }
        next();
    }, express.static(mediaDirectory, { dotfiles: "deny" }));
}
app.use("/api", (req, res, next) => next(new ApiError(404, "Endpoint not found")));
const frontendDirectory = fileURLToPath(new URL("../frontend/dist", import.meta.url));
if (existsSync(path.join(frontendDirectory, "index.html"))) {
    app.use(express.static(frontendDirectory));
    app.get("/{*path}", (req, res) => res.sendFile(path.join(frontendDirectory, "index.html")));
}
app.use((req, res, next) => next(new ApiError(404, "Endpoint not found")));
// Error middleware must be registered after every route.
app.use(errorHandler);
export { app };