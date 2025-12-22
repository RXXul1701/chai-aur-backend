import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String,
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        index:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users" 
   },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        required:true,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)
const Videos = mongoose.model("Videos",videoSchema)
export {Videos}