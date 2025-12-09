import { Router } from 'express';
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js"
router.use(verifyJWT);  // Apply verifyJWT middleware to all routes in this file
import { getChannelStats, getChannelVideos } from '../controllers/dashboard.controller.js';



router.route("/stats").get(getChannelStats);
 router.route("/videos").get(getChannelVideos);

export default router ;