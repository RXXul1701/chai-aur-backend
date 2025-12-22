import dotenv from 'dotenv'
dotenv.config()
import connectionDB from './db/index_db.js'
import express from 'express'
import app from "./app.js"

const port = process.env.PORT || 8000
connectionDB().then(
    ()=>{
        app.listen(port, ()=>{
            console.log("Listening on port ", port)
        })
    }
).catch((error)=>{
    console.log("DB CONNECTION FAILED:", error)
})
    



