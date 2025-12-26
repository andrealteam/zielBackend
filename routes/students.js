const express = require('express');
const {
  getStudents,
  getStudent,
  registerStudent,
  updateStudent,
  deleteStudent,
  getStudentsByCourse
} = require('../controllers/students');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('admin'), getStudents)
  .post(registerStudent);

router
  .route('/:id')
  .get(protect, getStudent)
  .put(protect, updateStudent)
  .delete(protect, authorize('admin'), deleteStudent);

router.get('/course/:course', getStudentsByCourse);

module.exports = router;
