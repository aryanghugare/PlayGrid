import { Router } from 'express';

import { verifyJWT } from "../middlewares/auth.middleware.js"
import { toggleSubscription, getUserChannelSubscribers } from '../controllers/subscription.controller.js';

import { setSubscription, getSubscribedChannels } from "../controllers/subscription-extra.controller.js";
const router = Router()
router.get("/u/:subscriberId", getUserChannelSubscribers);

router.use(verifyJWT) // Applying verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

// Explicit state endpoints are safe to retry, unlike the retained toggle endpoint.
router.route("/c/:channelId").put(setSubscription).delete(setSubscription);
router.get("/me", getSubscribedChannels);
export default router
