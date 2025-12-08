import {  Router  } from "express"; // This is for better practices 
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router()

router.route("/").get(healthCheck)

export default router; 

