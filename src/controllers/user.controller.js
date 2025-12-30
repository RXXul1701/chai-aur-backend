import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {Users} from "../models/Users.models.js"
import {uploadCloudinaryFile} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId)=>{
    const user = await Users.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
    return {accessToken,refreshToken}
}
const options = {
        httpOnly: true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict"
    }
const registerUser = asyncHandler(async (req,res)=>{
    //get user details from frontend *
    //validate the details - check if empty *
    //check if user already exists - username,email *
    //check for avatar and images *
    //upload in cloudinary *
    //create a user object - store entry in db *
    //remove password and refresh token from res *
    //check if user is created
    //return response
    const {fullname,email,userName,password} = req.body
    console.log(email)

    const validate = [fullname,email,userName,password].some((field)=>
    field?.trim() === ""
    )
    if (validate){
        throw new ApiError(
            400,
            'All fields are required'
        )
    }

    const existed = await Users.findOne({
        $or:[
            {email},
            {userName}
        ]
    })
    if (existed){
        throw new ApiError(
            409,
            "User already exists. Please log in"
        )
    }
    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    if (!avatarLocalPath){
        throw new ApiError(
            400,
            "Avatar missing"
        )
    }
    const avatarUpload = await uploadCloudinaryFile(avatarLocalPath)
    let coverImageUpload;
    if (coverImageLocalPath){
        coverImageUpload = await uploadCloudinaryFile(coverImageLocalPath)
    }
    if (!avatarUpload){
        throw new ApiError(
            400,
            "Avatar upload failed to cloudinary"
        )
    }

    const user = await Users.create({
        fullname,
        email,
        userName: userName.toLowerCase(),
        password,
        avatar: avatarUpload.url,
        coverImage: coverImageUpload?.url || ""
    })
    const createdUser = await Users.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new ApiError(
            500,
            "Some error occured during registering the user"
        )
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User has been registered successfully!"
        )
    )
})

const loginUser = asyncHandler(async (req,res)=>{
    //Take data from req body *
    //check username or email *
    //find user *
    //check password *
    //generate refreshToken and accessToken
    //Send cookies
    const {userName,email,password} = req.body
    if (!userName && !email){
        throw new ApiError(400, "UserName or email is required")
    }

    const user = await Users.findOne({
        $or: [{userName}, {email}]
    })

    if (!user){
        throw new ApiError(404, "User does not exist!")
    }
    
    const isPswdValid = await user.isPasswordCorrect(password)
    if (!isPswdValid){
        throw new ApiError(401,
            "Invalid user credentials."
        )
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await Users.findById(user._id).select(" -password -refreshToken")
    
    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                loggedInUser,
                refreshToken,
                accessToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    //remove refresh token
    await Users.findByIdAndUpdate(req.user._id,
        {
            $unset:{
                refreshToken : 1
            }
        }
    )
    //clear cookies
    
    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out."
        )
    )
})

//Refresh the tokens
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    const decodedInfo = jwt.verify(incomingRefreshToken, process.env.REFRESH_SECRET_KEY)
    const user = await Users.findById(decodedInfo?._id)
    if (!user){
        throw new ApiError(401, "Invalid refresh token")
    }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    res.status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {},
            "Access Token refreshed."
        )
    )
})

export {registerUser, loginUser, logoutUser, refreshAccessToken}