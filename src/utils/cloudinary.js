import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import path from "path"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadCloudinaryFile = async (localFilePath)=>{
    if (!localFilePath) return null 
    const normalizedPath = path.resolve(localFilePath).replace(/\\/g, "/");

        try{
        const response = await cloudinary.uploader.upload(normalizedPath,{
            resource_type:"auto"
        })
        console.log("File uploaded to cloudinary successfully!", response.url)
        fs.unlinkSync(normalizedPath, ()=>{});
        return response
    } catch(err){
        console.error("CLOUDINARY ERROR:", err);
        fs.unlinkSync(normalizedPath, ()=>{});
        return null
    }
}

export {uploadCloudinaryFile}