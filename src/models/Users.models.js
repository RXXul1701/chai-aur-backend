import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Videos"
    }],
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true
    },
    avatar:{
        type:String,//Cloudinary url
        required:true
    },
    coverImage:{
        type:String,
    },
    password:{
        type:String,
        required:true
    },
    refreshToken:{
        type:String,
        required:true
    }

},{timestamps:true})

//Hash the pswd before saving to db
userSchema.pre("save", async function(next){
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
//compare the pswd
userSchema.methods.isPasswordCorredt = async function(password){
    return await bcrypt.compare(password, this.password)
}

//Generate jwt access token
userSchema.methods.generateAccessToken = ()=>{
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
            email: this.email,
            fullname: this.fullname
        },
        process.env.ACCESS_SECRET_KEY,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
//Generate refresh token
userSchema.methods.generateRefreshToken = ()=>{
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_SECRET_KEY,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
const Users = mongoose.model("Users",userSchema)
export {Users}