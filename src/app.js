import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
// app.use() is the middleware 
// To handle the cross origin resource sharing 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
    // many options to explore 
}))

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


// routes import 
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import healthcheckRouter from './routes/healthcheck.routes.js'

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

export { app };