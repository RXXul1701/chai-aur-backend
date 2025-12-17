import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const connectionDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("\nConnected to DB at HOST", connectionInstance.connection.host)
    } catch(err){
        console.log("CONNECTION TO DB FAILED: ",err)
        process.exit(1)
    }
}

export default connectionDB;