import jwt from "jsonwebtoken"
import { Users } from "../models/Users.models.js"
import { ApiError } from "../utils/ApiError.js"

 
export const verifyJwt = async (req,res,next)=>{
    try {
        const token = req?.cookies?.accessToken || req.headers.authorization?.replace("Bearer ","")
        if (!token){
            throw new ApiError(401, "Invalid Token")
        }
    
        const decodedUser = jwt.verify(token, process.env.ACCESS_SECRET_KEY)
        const user = await Users.findById(decodedUser?._id).select("-password -refreshToken")
        if (!user){
            throw new ApiError(
                401, "Unauthorized access"
            )
        }
        req.user = user     //adding user context to request
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "User is not authorized to access this data")
    }
}