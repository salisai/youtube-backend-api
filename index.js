// require('dotenv').config({path: './env'}); 
//this above is also right but not modular and cosistent

import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
const app = express();

//to use app you must import express 

dotenv.config({
    path: './.env'
})//that env variables are availbale everywhere
//experimental feature k through add karna in scripts package.json
//  -r dotenv/config --experimental-json-modules 
//add this to the scripts



// connectDB()
//actually connectDB() is async therefore it will return some promises
//so we must handle it asynchrounous as well

//connectDB().then(callback).catch(callback)

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{//to set default port 8000
        console.log(`Server is running at port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MONGO DB connection failed ",error)
})



/*     FIRST APPROACH
HERE WE DID THE WORK IN ONE FILE THE CONNECTION AS WELL AS THE EXECUTION OF THE FUNCTION\\
import express from "express";

const app = express();
// function connectDB(){}

// connectDB(){}; => can be written in good form like below

//iife => we start iife by semi colon ; for cleaning purpose 
;( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)//database k agay name bhi zarori hai 
        app.on("error",(error)=>{       //=> app.on => listener 
            console.log("error",error);
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    }catch(error){
        console.error(`Error connecting to database: ${error.message}`);
        process.exit(1);
    }
})()

is say index file ziada pollute hojata hai 
this is not modular approach 

*/