import { Schema,model } from "mongoose";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema= new Schema({
    fullName:{
        type:'String',
        required:[true,'Name is required'],
        minLength:[4,'name must be at least 8 character'],
        maxLength:[50,'name should be less than 50 character'],
        trim:true,
        lowercase:true
    },
    email:{
        type:'String',
        lowercase:true,
        required:[true,'email is required'],
        trim:true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill in a valid email address',
          ],
        

    },
    password:{
        type:'String',
        required:[true,'password in required'],
        lowercase:true,
        select:false,// it will not show password if you are querying user related query
        minLength:[4,'password must be atleast 8 character']

    },
    avatar:{
        public_id:{
            type:'String'
        },
        secure_url:{
            type:'String'
        }
    },
    role:{
        type:'String',
        enum:['USER','ADMIN'],
        default:'USER'
    },
    forgotPasswordToken:String,
    forgotPasswordExpiry:Date,
    subscription:{
        id:String,
        status:String
    }
},{
    timestamps:true
});
userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password=await bcrypt.hash(this.password,10);
});

userSchema.methods={
    generateJWTToken:async function () {
        return await jwt.sign(
            {id:this._id,email:this.email,subscription:this.subscription,role:this.role},
            process.env.JWT_SECRET,
            {
                expiresIn:process.env.JWT_EXPIRY,   
            }
        )
    },
    comparePassword:async function (plaintextPassword){
        return await bcrypt.compare(plaintextPassword,this.password);
    },
    generatePasswordResetToken:async function(){
        const resetToken=await crypto.randomBytes(20).toString('hex');
        this.forgotPasswordExpiry=Date.now() + 15*60*1000;
        this.forgotPasswordToken=await crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')
        ;
        return resetToken;
    }
}



const User=model('User', userSchema);


export default User;