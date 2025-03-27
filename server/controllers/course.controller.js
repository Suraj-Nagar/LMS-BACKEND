import { fstat } from "fs";
import { readJsonConfigFile } from "typescript";
import Course from "../models/course.model.js"
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import e from "express";
import { secureHeapUsed } from "crypto";


const getAllCourses = async (req, res, next) => {
    try {

        const courses = await Course.findOne({}).select('-lectures');
        res.status(200).json({
            success: true,
            message: "all courses",
            courses,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }


}

const getLecturesByCourseId = async function (req, res, next) {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) {
            return next(new AppError("invalid course id", 400))
        }
        res.status(200).json({
            success: true,
            message: 'all lectures',
            lectures: course.lectures
        });


    } catch (error) {
        return next(new AppError(error.message, 500));
    }
}

const createCourse = async function (req, res, next) {
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !createdBy || !category) {
        return next(new AppError('all fields are required', 400))
    }

    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail: {
            public_id: 'dumy',
            secure_url: 'dumy',
        }
    });

    if (!course) {
        return next(new AppError(' course could not be created, Please try again', 400))
    }
    try {
        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms'

            });

            if (result) {
                course.thumbnail.secure_url = result.public_id;
                course.thumbnail.public_id = result.secure_url;
            }

            console.log(JSON.stringify(result));
            await fs.rm(`uploads/${req.file.filename}`);
        }
    } catch (error) {
        return next(new AppError(error.message, 400))

    }
    await course.save();

    res.status(200).json({
        success: true,
        message: 'course created successfully',
        course,
    });

};

const updateCourse = async function (req, res, next) {
    try {
        const { id } = req.params;
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body

            },
            {
                runValidators: true
            }
        )
        if (!course) {
            return next(new AppError('course with given id does not exists', 500))
        }
        res.status(200).json({
            success: true,
            message: "Course updated Successfully",
            course
        })
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const removeCourse = async function (req, res, next) {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return next(new AppError("Course with given ID does not exist", 404));
        }

        if (course.thumbnail && course.thumbnail.public_id) {
            await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
        }


        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const addLectureToCourseById = async function (req, res, next) {
    try {
        const { title, description } = req.body;
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!title || !description) {
            return next(new AppError('all fields are required', 400))
        }
        if (!course) {
            return next(new AppError("course does not exists", 404))
        }
        const lectureData = {
            title,
            description,
            lecture:{}
        };

        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms'

                });

                if (result) {
                    lectureData.lecture.secure_url = result.secure_url;
                    lectureData.lecture.public_id = result.public_id;
                }

                console.log(JSON.stringify(result));
                await fs.rm(`uploads/${req.file.filename}`);

            } catch (error) {
                return next(new AppError(error.message, 404))

            }
        }
        
        console.log('lecture>',JSON.stringify(lectureData));
        

        course.lectures.push(lectureData);
        course.numbersOflectures = course.lectures.length;
        await course.save();
        res.status(200).json({
            success: true,
            message: 'Lecture added sucessfully to the course',
            course
        })


    } catch (error) {
        return next(new AppError(error.message, 404));
    }



};

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseById
}