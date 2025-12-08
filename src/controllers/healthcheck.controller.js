// Health Check Controllers are used in backend applications to monitor the health and availability of a system and its dependent services.
import { ApiResponse } from "../utils/ApiResponses.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler( async(req,res)=>{
return res 
.status(200)
.json(new ApiResponse(200,[],"Health Check Successfull!!!!"))

})

export {healthCheck}
