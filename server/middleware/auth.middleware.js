import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken';

const isLoggedIn=async(req,res,next)=>{
    const {token}=req.cookies;

    if(!token){
        return next(new AppError('Unauthenticated please login again',401));
    }

    const userDetails =await jwt.verify(token,process.env.JWT_SECRET);
    req.user=userDetails;   
    next();
}

const authorizedRoles=(...roles)=>async(req,res,next)=>{
    const currentUserRoles=req.user.role;
    if(!roles.includes(currentUserRoles)){
        return next(new AppError("you don not have permission to view,Access denied",404))
    }
    next();
}

const authorizedSubscriber= async(req,res,next)=>{
    const user=await User.findById(req.user.id);
    console.log(user);
    
    if(user.role!== 'ADMIN' && user.subscription.status!=='active'){
        return next(new AppError('please subscribe to access this route',404));  
    }
    next();
}
export{
    isLoggedIn,
    authorizedRoles,
    authorizedSubscriber
}