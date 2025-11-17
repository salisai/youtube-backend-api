import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

//function for connection mongodb
const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\nMongodb connected!! DB host: ${connectionInstance.connection.host}`);
    } catch(err){
        console.log("MONGODB connection error",err.message|| err);//MONGODB connection error MongoServerError
        process.exit(1)//alag alag exit k codes hai I will use 1, like exit 1, exit 0
    }
}

export default connectDB;


//off course there will be problems in your code for big project 
//mongoose apko return karta hai ik object , here connectionInstance is the that variable
//connectionInstance have many objects
//we use connection.host here

//now use this function connectDB in index.js 


/*you have to options:



*/