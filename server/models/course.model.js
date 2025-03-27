import { model,Schema } from "mongoose";

const courseSchema= new Schema({
        title:{
            type:String,
            required:[true,'tittle is required'],
            minLength:[8,'Tittle must be at least 8 character'],
            maxLength:[60,'tittle should be less than 60 character'],
            trim:true
        },
        description:{
            type:String,
            required:[true,'description  is required'],
            minLength:[8,'description  must be at least 8 character'],
            maxLength:[200,'tittle should be less than 60 character'],
            trim:true
        },
        category:{
            type:String,
            required:[true,'category is required'],
        },
        thumbnail:{
            public_id:{
                type:String,
                required:true
            },
            secure_url:{
                type:String,
                required:true
            }
        },
        lectures:[
            {
                tittle:String,
                description:String,
                lecture:{
                    public_id:{
                        type:String,
                        required:true

                    },
                    secure_url:{
                        type:String,
                        required:true
                    }
                }
            }
        ],
        numbersOflectures:{
            type:Number,
            default:0,
        },
        createdBy:{
            type:String,
            required:true,

        }
},{
    timestamps:true
});

const Course=model('Course',courseSchema);
export default Course;  