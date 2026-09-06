import { Router } from "express";
import {
    loginUser, registerUser, logOutUser, refreshAccessToken, updateAccountDetails1
    , changeCurrentPassword, updateUserAvatar, getcurrentUser, updateUserCoverImage, getUserChannelProfile , getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, optionalJWT } from "../middlewares/auth.middleware.js";

import { recordHistory, removeHistory } from "../controllers/history.controller.js";
import { rateLimit } from "../middlewares/security.middleware.js";
const router = Router()
const authLimit = rateLimit();
// upload here is used as middleware to upload these images on the local disk/local Storage 
// So here upload.fields() is used , because we want to upload two things that is avatar and coverImage 
// if there was only one thing to upload we could use  upload.single()
router.route("/register").post(
    authLimit,
    upload.fields([{
        name: "avatar",
        maxCount: 1

    },
    {
        name: "coverImage",
        maxCount: 1
    }

    ]),
    registerUser)
router.route("/login").post(authLimit, loginUser);
// secured routes 
router.route("/logout").post(optionalJWT, logOutUser);
router.route("/refresh-token").post(rateLimit({ limit: 120 }), refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/updateDetails").patch(verifyJWT, updateAccountDetails1)
router.route("/current-user").get(verifyJWT, getcurrentUser)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
// So for update-avatar , change-password ,update details we need user login to be compulsory  that's why different middlewares like verifyJWT , upload(multer) are used 
router.route("/c/:username").get(optionalJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)
router.route("/history").delete(verifyJWT, removeHistory);
router.route("/history/:videoId").put(verifyJWT, recordHistory).delete(verifyJWT, removeHistory);
export default router;