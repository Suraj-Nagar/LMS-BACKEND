
import Course from "../models/course.model.js"
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import asyncHandler from "../middleware/asyncHandler.middleware.js";



const getAllCourses = async (req, res, next) => {
    try {

        const courses = await Course.find({}).select('-lectures');
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
                course.thumbnail.secure_url = result.secure_url;
                course.thumbnail.public_id = result.public_id;
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

const updateCourseById = async function (req, res, next) {
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
            lecture: {}
        };

        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    chunk_size:50000000,
                    resource_type:'video',

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

        console.log('lecture>', JSON.stringify(lectureData));


        course.lectures.push(lectureData);
        course.numbersOflectures = course.lectures.length;
        await course.save();
        res.status(200).json({
            success: true,
            message: 'Lecture added sucessfully to the course',
            course
        })


    } catch (error) {
        console.log(error);
        
        return next(new AppError(error.message, 404));
    }



};

const deleteCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new AppError('Course with given id does not exist.', 404));
  }

  await course.remove();
  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
});

const removeLectureFromCourse = asyncHandler(async (req, res, next) => {
  // Grabbing the courseId and lectureId from req.query
  const { courseId, lectureId } = req.query;

  console.log(courseId);

  // Checking if both courseId and lectureId are present
  if (!courseId) {
    return next(new AppError('Course ID is required', 400));
  }

  if (!lectureId) {
    return next(new AppError('Lecture ID is required', 400));
  }

  // Find the course uding the courseId
  const course = await Course.findById(courseId);

  // If no course send custom message
  if (!course) {
    return next(new AppError('Invalid ID or Course does not exist.', 404));
  }

  // Find the index of the lecture using the lectureId
  const lectureIndex = course.lectures.findIndex(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );

  // If returned index is -1 then send error as mentioned below
  if (lectureIndex === -1) {
    return next(new AppError('Lecture does not exist.', 404));
  }

  // Delete the lecture from cloudinary
  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_id,
    {
      resource_type: 'video',
    }
  );

  // Remove the lecture from the array
  course.lectures.splice(lectureIndex, 1);

  // update the number of lectures based on lectres array length
  course.numberOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  // Return response
  res.status(200).json({
    success: true,
    message: 'Course lecture removed successfully',
  });
});


export {
    getAllCourses,
    getLecturesByCourseId,
    deleteCourseById,
    createCourse,
    updateCourseById,
    removeCourse,
    addLectureToCourseById,
    removeLectureFromCourse
}