import { config } from 'dotenv';
config();
import app from "../server/app.js";
import connectionTodb from './config/dbConnection.js';
import {v2 as cloudinary} from "cloudinary";
import Razorpay from 'razorpay';
const PORT =process.env.PORT||8080;
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});
export const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET,
})
app.listen( PORT ,async()=>{
    await connectionTodb();
    console.log(`server is running on:http:localhost:${PORT}`);
    
});