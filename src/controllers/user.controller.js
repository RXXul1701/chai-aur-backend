import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {Users} from "../models/Users.models.js"
import {uploadCloudinaryFile} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefreshToken = async (userId)=>{
    const user = Users.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
    return accessToken,refreshToken
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
    
    const isPswdValid = await Users.isPasswordCorrect(password)
    if (!isPswdValid){
        throw new ApiError(401,
            "Invalid user credentials."
        )
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await Users.select(" -password -refreshToken")
    const options = {
        HttpOnly: true,
        Secure:true
    }
    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie(("refreshToken", refreshToken, options))
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

export {registerUser, loginUser}