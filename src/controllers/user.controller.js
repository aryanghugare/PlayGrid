import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import { deletefromCloudinary } from "../utils/deleteCloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { text, email as validEmail, password as validPassword, safeUser, pagination, pageResult } from "../utils/validation.js";
import { removeMedia } from "../services/media.js";
import { videoDTO } from "../services/videos.js";
// if you are updating some files like coverImage , avatar keep thier end points different 
// By diiferent i mean , there routes will be different 
//router.route("/avatar")
//router.route("/cover-image") 
// This is Because , let's say user wants to update its coverImage ,
// if you put it inside route like login , the whole other data goes with it which is  not optimal 


// So here we will be not using asyncHandler because ...
// We are not dealing with any route request in this method 

const generateAccessAndRefereshTokens = async (userId, expectedRefreshToken) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken()

        user.refreshToken = refreshToken;
        if (expectedRefreshToken) {
            // Compare-and-swap prevents two refresh requests from reusing one token.
            const rotated = await User.updateOne({ _id: userId, refreshToken: expectedRefreshToken }, { $set: { refreshToken } });
            if (!rotated.modifiedCount) throw new ApiError(401, "Refresh token was already used");
        } else await user.save({ validateBeforeSave: false }) // to save the refresh token, but we dont have the other required(compulsory ) fields , that's why validateBeforeSave: false

        return { accessToken, refreshToken }
    } catch (error) {
        throw error instanceof ApiError ? error : new ApiError(500, "Could not create session")
    }



}



const registerUser = asyncHandler(async (req, res) => {
    const uploadedAssets = [];
    try {
    // get the user details from frontend 
    // this is taken through postman 
    // look how to do file handling 
    // validation - not empty 
    // check if user already exist : username,email // Any field can be used for the checking 
    // check for images , check for avatar 
    // upload these images on cloudinary , and again check whether the avatar is uploaded or not 
    // create user object - create entry in db.   .create()
    // remove password and refresh token field from response 
    // check for user creation 
    // return res 


    const fullName = text(req.body.fullName, "Full name", { max: 80 });
    const email = validEmail(req.body.email);
    const username = text(req.body.username, "Username", { min: 3, max: 30 }).toLowerCase();
    if (!/^[a-z0-9_]+$/.test(username)) throw new ApiError(400, "Username can contain letters, numbers and underscores");
    const password = validPassword(req.body.password); // the data coming from form and json of frontend is catch by req.body
    // console.log(req.body);
    // console.log(req.files);


    // console.log("email", email);
    // checking every validation manually 
    /* if (fullName === "") {
        throw new ApiError(400, "fullName is required")

    }
*/
    // This are the validation 
    // These is validation to check whether any field is empty or not 
    // These are the required fields
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "") // .some() is the array method 
    ) {
        throw new ApiError(400, "All fields are required ")
    }
    // validation for email address to have "@"
    if (!email.includes("@")) {
        throw new ApiError(400, "Enter a proper Email address  ")
    }

    // To check whether user already exits or not 
    // Now this User thing will call the mongDb in behalf of me whenever i need to 

    const existedUser = await User.findOne({
        $or: [{ username }, { email }] // This $or to check both username and email at the same time 
        // we can also use                const existingUser = await User.findOne({ email });
    }); // User.find() can also be used 

    if (existedUser) {
        throw new ApiError(409, "User with email or username already registered")
    }


    // Correct optional chaining syntax for accessing avatar path
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // req.files is because of multer middleware that we have used 
    // express gives access to req.body


    // we dont have any checks for coverImage is there or not 
    // because adding the cover image is not necessary for our use case for this application 
    // So for that 

    let coverImageLocalPath; // This coverImage checking can also can be done using a simple if else loop tooo , it is done in the udemy course of this same project
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // There are may ways to check this coverImage 
    // So the thing with coverImage is , this is not compulsory field(required)
    // So if the user has not uploaded any coverImage , so it should be shown as empty 
    // But this is not the case with avatar 
    // avatar is required field 


    // checking whether the avatar is present or not 
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing ")
    }

    // Uploading these images on cloudinary 
    // Taking thier references in the variables 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, req.files?.coverImage?.[0]);
    if (coverImage?.public_id) uploadedAssets.push(coverImage.public_id)
    const avatar = await uploadOnCloudinary(avatarLocalPath, req.files?.avatar?.[0]);
    if (avatar?.public_id) uploadedAssets.push(avatar.public_id)
    // Checking the avatar is there or not 
    if (!avatar) {
        throw new ApiError(400, "Avatar has been not uploaded properly on cloudinary ")
    }

    // Create the entry on the database 
    // await is used because while storing , there can be error from the database 
    // Also remember the database is always in different continent 
    const user = await User.create({
        fullName,
        avatar: avatar.secure_url || avatar.url,
        avatarPublicId: avatar.public_id,
        coverImagePublicId: coverImage?.public_id,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // To see whether this data is created in database or not 
    // The thing is whenever there is a new entry in database there is field of _id generated it with it 
    // So to find whether the entry is created , we will use   User.findById(user._id)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // Through .select() we dont want password and refreshToken details 


    if (!createdUser) {
        throw new ApiError(503, "User has not been created on database ")
    }

    // return new ApiResponse(200, createdUser, "User has been created successfully").    this is wrong 
    return res.status(201).json(
        new ApiResponse(201, safeUser(createdUser), "User Registered Successfully"))

    } catch (error) {
        await Promise.all(uploadedAssets.map(id => removeMedia(id)));
        throw error;
    }
})

/*  My login method 
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data 
    // username or email 
    // find the user 
    // password check 
    // access and refresh token 
    // send cookie 

    const { email, username, password, fullName } = req.body;
    console.log("Hii i am the response", req.body);

    if (!username || !email) {
        throw new ApiError(457, "Both the username and email are required")
    }
    const existedUser = await User.findOne({
        username, email
    });

    const passwordCheck = await existedUser.isPasswordCorrect(password)
    if (!passwordCheck) {
        throw new ApiError(445, "Password is incorrect")
    }
    // So here we need the both username , email in one collection 
    // which is different case in register User method 

    if (existedUser) {
        return res.status(288).json(
            new ApiResponse(234, User, "Login successfull")
        )

    } else {
        throw new ApiError(443, "User does not exist ")
    }

})
*/

const loginUser = asyncHandler(async (req, res) => {

    // req body -> data 
    // username or email 
    // find the user 
    // password check 
    // access and refresh token 
    // send cookie 

    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
    const username = typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : undefined;
    const { password } = req.body;
    if (typeof password !== "string" || !password) throw new ApiError(400, "Password is required");

    if (!username && !email) {
        throw new ApiError(400, "username or email is required ")
    }
    // find the entry , which has either username or email which has comne from response (req.body)
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(401, "Email, username or password is incorrect")
    }

    const passwordCorrect = await user.isPasswordCorrect(password)
    if (!passwordCorrect) {
        throw new ApiError(401, "Email, username or password is incorrect")
    }
    await User.updateOne({ _id: user._id }, { $inc: { sessionVersion: 1 } });
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    // console.log("This is access token", accessToken);
    // console.log("This is refresh token", refreshToken);

    // Access Token is short Lived and Refresh Token is long-lived 
    // The full Stroy of access token and refrsh token Backend Part 2 (1:12:50)
    // Send to the cookie 


    // so this user which we have from database on the line 199 , does not have access Token and refresh token ( part2 backend 27:37 )
    // So we can do two things , we can update this user , which we already have or can again call to the database , which can be expensive(depends on situation to situation )
    // Method of calling to the database - Method 1 
    // Important method for the databse retrieval
    // Model.find(query).select(fields)
    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken") // This thing is optional


    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.COOKIE_SAME_SITE || "lax",
        path: "/"
    } // through this options we are ensuring that the cookies can be modified from backend only(server only )

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: safeUser(loggedInUser),
        },
            "User LoggedIn Successfully"
        )
        )


})

const logOutUser = asyncHandler(async (req, res) => {
    // Since your auth uses:
    // Access token → short-lived, no need to "invalidate" it server-side (it just expires).
    // Refresh token (in httpOnly cookie) → this is what keeps the user logged in.
    // 👉 Logout = clear the refresh token so the client can’t request new access tokens.
    // Optionally, also clear refresh token from DB (if you store it)
    const logoutUser = req.user || (req.cookies?.refreshToken ? await User.findOne({ refreshToken: req.cookies.refreshToken }) : null);
    await User.findByIdAndUpdate(logoutUser?._id || null,
        {
            // to clear the refresh token 
            // 1st way 

            // $set: {
            //     refreshToken: ""
            // }

            // 2nd way 
            $inc: { sessionVersion: 1 },
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true, // This is to have the return response that will have the updated value of refresh token
        }
    )
    // Sooo here , what we did is through auth.middleware.js we gave req a req.user 
    // Through this we can update the refresh  token 
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.COOKIE_SAME_SITE || "lax",
        path: "/"
    }


    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logout successful"))
})

// The thing is access Token is for short period 
// After expiration of the access token , we will generate new one ,
// with the help of refresh token 
// If the refresh token stored in database matches the refresh token in the cookie 
// then we will generate the new access token




const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get refresh token from cookies (browser) OR body (mobile/API)
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "UnAuthorized request - No refresh token");
    }
    try {

        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
        const user = await User.findById(decoded?._id);
        if (!user) throw new ApiError(400, "You are not allowed for refresh token ")
        if (user.refreshToken !== incomingRefreshToken || (user.sessionVersion || 0) !== (decoded.version || 0)) {
            throw new ApiError(401, "Refresh Token is expired or used ")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        sameSite: process.env.COOKIE_SAME_SITE || "lax",
        path: "/"
        }


        // Generate new access token 
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id, incomingRefreshToken)
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200,

                {
                    sessionRefreshed: true
                },
                "Access Token refresh successfully "


            ))

    } catch (error) {
        throw new ApiError(401, "Session expired. Please sign in again")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        if (typeof oldPassword !== "string") throw new ApiError(400, "Current password is required");
        // We can also add something like confirm password (optional)
        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "Both old and new password are required");
        }
        // const same = await bcrypt.compare(newPassword, oldPassword)
        // if (same) return new ApiError(415, "New and old Password cannot be same ")
        if (newPassword === oldPassword) {
        throw new ApiError(400, "New and old Password cannot be same")
        }
        // So here the thing , we will use the middleware of auth.middleware.js , in the user.routes
        // soo after this req will have req.user 
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old Password ")
        }

        validPassword(newPassword);
        user.refreshToken = undefined;
        user.sessionVersion = (user.sessionVersion || 0) + 1;
        user.password = newPassword
        await user.save({ validateBeforeSave: false });
        const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.COOKIE_SAME_SITE || "lax", path: "/" };
        res.clearCookie("accessToken", options).clearCookie("refreshToken", options);
        // what is happenning here is , we have a pre hook for User schema, where there is save operation it checks 
        // whether the password is entered first time or whether the password is changed , in this cases 
        // User schema encrypts the new password which is plain text using bcrypt and stores it 
        return res.status(200)
            .json(new ApiResponse(200, "Password changed Successfully "))


    } catch (error) {
        throw error instanceof ApiError ? error : new ApiError(500, "Could not change password")
    }



})

const getcurrentUser = asyncHandler(async (req, res) => {

    const current = safeUser(req.user)

    return res.status(200)
        .json(new ApiResponse(200, current, "You have the current user context "))

})

// This is the method to update the fullname and email  
// We can update anything which we want 

// This will throw error 

// Actually after testing , it is not throwing error 
const updateAccountDetails1 = asyncHandler(async (req, res) => {
    const fullname = text(req.body.fullName ?? req.body.fullname, "Full name", { max: 80 });
    const email = validEmail(req.body.email)
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user._id,
        { // $set can also be used here 
            fullName: fullname,  // fullName is the field in the database 
            email: email
        },
        { new: true, runValidators: true }

    ).select("-password") // This is used to dont include the password in this response 
    return res.status(200)
        .json(new ApiResponse(200, safeUser(user), "Account Details updated Successfully  "))

});



// Second method to update account details 

const updateAccountDetails2 = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { fullname, email } },
        { new: true, runValidators: true, select: "-password" } // exclude password
    );

    return res.status(200).json(
        new ApiResponse(200, user, "Account Details updated Successfully")
    );
});


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarpath = req.file?.path;
    const prevAvatar = req.user.avatar; // this is variable of previous avatar in the databsse 

    if (!avatarpath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatarcloud = await uploadOnCloudinary(avatarpath, req.file);
    if (!avatarcloud?.url) {
        throw new ApiError(400, "Error while uploading file on cloudinary ")
    }


    // so the assignment is 
    // as i am updating the user avatar , we will be deleting the old avatar image from cloudinary 


    // This method of getting the publicId from url is chatGpt generated 
    function getPublicIdFromUrl(prevAvatar) {
        const parts = prevAvatar.split("/");
        const fileWithExt = parts.pop(); // e.g. "stlewelcy9ampkfq5tpy.jpg"

        // Check if previous part is a version ("v12345")
        if (parts[parts.length - 1]?.startsWith("v")) {
            parts.pop(); // remove version
        }

        const publicId = fileWithExt.split(".")[0]; // remove extension
        return [...parts.slice(parts.indexOf("upload") + 1), publicId].filter(Boolean).join("/");
    }

    const publicId = req.user.avatarPublicId || getPublicIdFromUrl(prevAvatar)

    // Delete the old asset only after the database update succeeds.


    // Here , I am updating the databse with the new url 
    // I just did, try catch for safety purpose , not needed 
    try {
        const user = await User.findByIdAndUpdate(req.user._id, {

            avatar: avatarcloud.secure_url || avatarcloud.url,
            avatarPublicId: avatarcloud.public_id
        },
            {
                new: true,
            }
        )
            .select("-password")

        await removeMedia(publicId);
        return res
            .status(200)
            .json(new ApiResponse(200, safeUser(user), "The Avatar is updated successfully "))

    }
    catch (error) {
        await removeMedia(avatarcloud.public_id);
        throw new ApiError(500, "Error While updating the avatar")

    }

})


// When there will be file uploads , have thier end points different

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    const prevcoverImage = req.user.coverImage;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath, req.file)

    if (!coverImage?.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }



    function getPublicIdFromUrl(prevCoverImage) {
        const parts = prevCoverImage.split("/");
        const fileWithExt = parts.pop(); // e.g. "stlewelcy9ampkfq5tpy.jpg"

        // Check if previous part is a version ("v12345")
        if (parts[parts.length - 1]?.startsWith("v")) {
            parts.pop(); // remove version
        }

        const publicId = fileWithExt.split(".")[0]; // remove extension
        return [...parts.slice(parts.indexOf("upload") + 1), publicId].filter(Boolean).join("/");
    }

    const publicId = req.user.coverImagePublicId || (prevcoverImage ? getPublicIdFromUrl(prevcoverImage) : null)
    // Delete the old asset only after the database update succeeds.

    let user;
    try {
    user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.secure_url || coverImage.url,
                coverImagePublicId: coverImage.public_id
            }
        },
        { new: true }
    ).select("-password")

    } catch (error) { await removeMedia(coverImage.public_id); throw error; }
    await removeMedia(publicId);
    return res
        .status(200)
        .json(
            new ApiResponse(200, safeUser(user), "Cover image updated successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    // After agggregation pipelines , the response data is of arrays 
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers" // $ is required because this field we have created in prev mongo db aggregation stages not originally present in the database 
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo" // $ is required because this field we have created in prev mongo db aggregation stages not originally present in the database 

                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // $in looks for the condition in both arrays and object 
                        then: true,
                        else: false
                    }
                }


            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                // Email is private account data, not part of a public channel response.
                coverImage: 1,

            }
        }

    ])
    if (!channel?.length) throw new ApiError(404, "Channel not found")

    // Channel details are returned below instead of logging profile data.


    return res.status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel profile fetched successfully ")
        )

})


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) // Here the thing we can use to get the actual mongoDb Id (3:21:00 Backend Part 2) in the aggregation pipeline 
            }

        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                // This is the additional , optional 
                pipeline : [
                  { $match: { $or: [{ isPublished: true }, { owner: req.user._id }] } },
                  {
                 $lookup : {
                from : "users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]

                }
                },
                {
                $addFields : {
                owner : {
                $first : "$owner"
                }

                }
                }

                ] 

            }
        },
        { $project: { watchHistory: 1 } }
    ])


const paging = pagination(req.query);
const ids = new Map((req.user.watchHistory || []).map((id, index) => [String(id), index]));
const history = user[0]?.watchHistory || [];
history.sort((a, b) => ids.get(String(a._id)) - ids.get(String(b._id)));
return res.status(200)
.json(new ApiResponse(200, pageResult(history.slice(paging.skip, paging.skip + paging.limit).map(videoDTO), history.length, paging),"Watch History is fetched successfully!!"))


})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getcurrentUser,
    updateAccountDetails1,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}