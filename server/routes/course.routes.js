import { Router } from "express";
import { createCourse, removeCourse, getAllCourses, getLecturesByCourseId, updateCourse, addLectureToCourseById } from "../controllers/course.controller.js";
import { authorizedRoles, authorizedSubscriber, isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
const router=Router();

router
    .route('/')
    .get(getAllCourses)
    .post(
        isLoggedIn,
        upload.single('thumbnail'),

        authorizedRoles('ADMIN'),
        createCourse
    )
    
router
    .route('/:id')
    .get(isLoggedIn,authorizedSubscriber,getLecturesByCourseId)
    .put(isLoggedIn,authorizedRoles('ADMIN'),updateCourse)
    .delete(isLoggedIn,authorizedRoles('ADMIN'),removeCourse)
    .post(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        upload.single('thumbnail'),
        addLectureToCourseById
    )

export default router;


