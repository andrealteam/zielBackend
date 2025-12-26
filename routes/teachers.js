const express = require('express');
const router = express.Router();
const {
  getMe,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teachers');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Teacher = require('../models/Teacher');

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/:id', updateTeacher);

// Admin routes
router.use(authorize('admin'));
router
  .route('/')
  .get(advancedResults(Teacher), getTeachers);

router
  .route('/:id')
  .get(getTeacher)
  .delete(deleteTeacher);

module.exports = router;
