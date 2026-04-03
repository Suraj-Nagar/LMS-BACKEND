import { Router } from 'express';
import {
  addLectureToCourseById,
  createCourse,
  deleteCourseById,
  getAllCourses,
  getLecturesByCourseId,
  removeLectureFromCourse,
  updateCourseById,
} from '../controllers/course.controller.js';
import {
  authorizedRoles,
  authorizedSubscriber,
  isLoggedIn,
} from '../middleware/auth.middleware.js';
import upload from '../middleware/multer.middleware.js';

const router = Router();

router
  .route('/')
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizedRoles('ADMIN'),
    upload.single('thumbnail'),
    createCourse
  )
  .delete(isLoggedIn, authorizedRoles('ADMIN'), removeLectureFromCourse);

router
  .route('/:id/lectures')
  .post(
    isLoggedIn,
    authorizedRoles('ADMIN'),
    upload.single('lecture'),
    addLectureToCourseById
  )
 router.route('/:id/get').get(isLoggedIn, getLecturesByCourseId) 
  .put(isLoggedIn, authorizedRoles('ADMIN'), updateCourseById);
router.delete("/:id", isLoggedIn, authorizedRoles("ADMIN"), deleteCourseById);
export default router; 