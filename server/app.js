import cookieParser from "cookie-parser";
import express, { json } from "express";
import cors from "cors";

const app=express();
app.use(express.urlencoded({extended:true}));
app.use(json());
app.use(morgan('dev'));
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    cardentials:true
}));
app.use(cookieParser());
import { config } from 'dotenv';
import morgan from "morgan";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from './routes/course.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import errorMiddleware from "./middleware/error.middleware.js";
config(); 
app.use('/api/v1/courses',courseRoutes);
app.use('/api/v1/user',userRoutes);
app.use('/api/v1/payments',paymentRoutes);

app.all('*',(req,res)=>{
    res.status(404).send("OOPS 404 page not found");
});
app.use(errorMiddleware);
export default app;
