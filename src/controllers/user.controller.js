import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {Users} from "../models/Users.models.js"
import {uploadCloudinaryFile} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
            `${field} is empty`
        )
    }

    const existed = Users.findOne({
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

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    if (!avatarLocalPath){
        throw new ApiError(
            400,
            "Avatar missing"
        )
    }

    const avatarUpload = uploadCloudinaryFile(avatarLocalPath)
    const coverImageUpload = uploadCloudinaryFile(coverImageLocalPath)
    if (!avatarUpload){
        ApiError(
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
        coverImage: coverImage?.url || ""
    })
    const createdUser = await Users.findById(user._id).select(
        "--password --refreshToken"
    )
    if (!createdUser){
        throw new ApiError(
            500,
            "Some error occured during registering the user"
        )
    }

    return res.statusCode(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User has been reigstered successfully!"
        )
    )
})


export {registerUser}