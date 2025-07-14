import { fstat } from "fs";
import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

const cookieOptions={
    maxAge:7*24*60*60*1000,
    httpOnly:true,
    secure:true
}

const register=async(req,res,next)=>{
    const{fullName,email,password}=req.body;
    if(!fullName||!password||!email){
        return next(new AppError('all fields are required',400))
    }

    const userExists=await User.findOne({email});
    if(userExists){
        return next(new AppError("email already exists",400));
    }
    const user=await User.create({
        fullName,
        email,
        password,
        avatar:{
            public_id:email,
            secure_url:'https://res-console.cloudinary.com/dpvtcf9gp/media_explorer_thumbnails/86df9d23543946495f6949b34a1a9faa/detailed'
        }
    });
    if(!user){
        return next(new AppError('user registration failed, please try again later',400));
    }
    

    //TODO: File upload
    console.log("file details", JSON.stringify(req.file));
    if (req.file) {
         try {
            const result=await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                width:250,
                height:250,
                gravity:'faces',
                crop:'fill'
            });

            if(result){
                user.avatar.public_id=result.public_id;
                user.avatar.secure_url=result.secure_url;
                //remove file from server
                  fs.rm(`uploads/${req.file.filename}`);

            }
        } catch (error) {
            return next(new AppError(error || ' file not uploaded ! please try again later ',500))
            
        }
        
    }

    await user.save();
    user.password=undefined;

    const token=await user.generateJWTToken();
    res.cookie('token',token,cookieOptions);

    res.status(201).json({
        success:true, 
        message:"user resgistered successfully",
        user,
    })
};

const login=async(req,res,next)=>{
    try {
        const {email,password}=req.body;
        if(!email||!password){ 
        return next(new AppError('all fields are required',400));
        }
        const user=await User.findOne({
            email
        }).select('+password');

        if(!user||!user.comparePassword(password)){
            return next(new AppError('user is not exists',400));    
        }
        
        const token= await user.generateJWTToken();
        user.password=undefined;

        res.cookie('token',token,cookieOptions);
        res.status(200).json({
        success:true,
        message:'User logged in successfully',
        user,
        });
    } catch (e) {
        return next(new AppError(e.message,500));
    }
};

const logout=async(req,res,next)=>{
    res.cookie('token',null,{
        secure:true,
        maxAge:0,
        httpOnly:true
    });
    res.status(200).json({
        success:true,
        message:'User logged out successfully'
    })
};

const getProfile=async(req,res,next)=>{
    try {
        const userId=req.user.id;
        const user=await User.findById(userId);
        res.status(200).json({
            success:true,
            message:'user details',
            user
        })
        
    } catch (e) {
        return next(new AppError('failed to fetch profile',400));
    }
};

const forgotPassword=async (req,res,next) => {
    const {email}=req.body;
    if(!email){
        return next(new AppError('email is required',400))
    }
    const user=await User.findOne({email});
    if(!user){
        return next(new AppError("email is not registered",400));
    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();
    const resetPasswordUrl=`${process.env.FRONTEND_URL}/reset-password/${resetToken}`;  
    console.log(resetPasswordUrl);
    
    const subject='lere lndke bdl le password';
    const message=` You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;
    try {
        await sendEmail(email,subject,message);
        res.status(200).json({
            success:true,
            message:`reset password token has been sent to ${email} successfully`
        })
    } catch (error) {
        user.forgotPasswordExpiry=undefined;
        user.forgotPasswordToken=undefined;
        await user.save();
        return next(new AppError(error.message,500))
    }
}

const resetPassword=async(req,res,next)=>{
        const {resetToken}=req.params;
        const {password}=req.body;
        const forgotPasswordToken=crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
        const user=await User.findOne({
            forgotPasswordToken,
            forgotPasswordExpiry : { $gt : Date.now()}
        });
        if(!user){
            return next( new AppError("token is invalid or expire, please try again ",400));
        }
        user.password=password;
        user.forgotPasswordExpiry=undefined;
        user.forgotPasswordToken=undefined;
        user.save();

        res.status(200).json({
            success:true,
            message:'password changed successfully!'

        })


}

const changePassword=async(req,res,next)=>{
    const {oldPassword,newPassword}=req.body;
    const {id}=req.user;
    if(!oldPassword || !newPassword){
        return next(new AppError("All fields are mandatory"));
    }
    const user=await User.findById(id).select('+password');
    if(!user){
        return next(new AppError('user not exists please try again ',400))
    }
    
    const isPasswordValid=await user.comparePassword(oldPassword);
    if(!isPasswordValid){
        return next(new AppError("enter correct password",400))
    }
    user.password=newPassword;
    await user.save();
    user.password=undefined;
    
    res.status(200).json({
        success:true,
        message:"password changed successfully"
    })
}

const updateUser=async (req,res,next) => {
    const {fullName}=req.body;
    const id=req.user.id;
    const user=await User.findById(id);
    if(!user){
        return next(new AppError("user not exists",400))
    }
    user.fullName=fullName;
    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        try {
           const result=await cloudinary.v2.uploader.upload(req.file.path,{
               folder:'lms',
               width:250,
               height:250,
               gravity:'faces',
               crop:'fill'
           });

           if(result){
               user.avatar.public_id=result.public_id;
               user.avatar.secure_url=result.secure_url;
               //remove file from server
                 fs.rm(`uploads/${req.file.filename}`);

           }
       } catch (error) {
           return next(new AppError(error || ' file not uploaded ! please try again later ',500))
           
       }
    }
    await user.save();
    res.status(200).json({
        success:true,
        message:"profile update successfully"
    })
}

export {
    login,
    register,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
};
