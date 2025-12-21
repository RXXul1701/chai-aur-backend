import dotenv from 'dotenv'
import connectionDB from './db/index_db.js'
import express from 'express'

const app = express()
dotenv.config()
port = process.env.PORT || 8000
connectionDB().then(
    ()=>{
        app.listen(port, ()=>{
            console.log("Listening on port ", port)
        })
    }
).catch(error)(
    console.log(`DB CONNECTION FAILED: ${error}`)
)


