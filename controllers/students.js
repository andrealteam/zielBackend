const Student = require('../models/Student');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register a new student
// @route   POST /api/v1/students
// @access  Public
exports.registerStudent = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    contactNo,
    address,
    className,
    courses,
    courseMode,
    startDate,
    endDate,
    password
  } = req.body;

  // Calculate total amount and individual course totals
  let totalAmount = 0;
  const updatedCourses = { ...courses };
  
  Object.keys(updatedCourses).forEach(courseKey => {
    const course = updatedCourses[courseKey];
    if (course.selected && course.fee) {
      const fee = parseInt(course.fee, 10) || 0;
      const classes = parseInt(course.classes, 10) || 1;
      const courseTotal = fee * classes;
      
      updatedCourses[courseKey] = {
        ...course,
        fee: fee,
        classes: classes,
        total: courseTotal
      };
      
      totalAmount += courseTotal;
    } else {
      updatedCourses[courseKey] = {
        selected: false,
        fee: 0,
        classes: 0,
        total: 0
      };
    }
  });

  // Create student
  const student = await Student.create({
    name,
    email,
    contactNo,
    address,
    className,
    courses: updatedCourses,
    courseMode,
    startDate,
    endDate,
    totalAmount,
    password
  });

  // Create token
  const token = student.getSignedJwtToken();

  res.status(201).json({
    success: true,
    token,
    data: student
  });
});

// @desc    Get all students
// @route   GET /api/v1/students
// @access  Private/Admin
exports.getStudents = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single student
// @route   GET /api/v1/students/:id
// @access  Private
exports.getStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return next(
      new ErrorResponse(`Student not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: student
  });
});

// @desc    Update student
// @route   PUT /api/v1/students/:id
// @access  Private
exports.updateStudent = asyncHandler(async (req, res, next) => {
  let student = await Student.findById(req.params.id);

  if (!student) {
    return next(
      new ErrorResponse(`Student not found with id of ${req.params.id}`, 404)
    );
  }

  // Recalculate total amount and individual course totals if courses are being updated
  if (req.body.courses) {
    let totalAmount = 0;
    const updatedCourses = { ...req.body.courses };
    
    Object.keys(updatedCourses).forEach(courseKey => {
      const course = updatedCourses[courseKey];
      if (course.selected && course.fee && course.classes) {
        const fee = parseInt(course.fee, 10) || 0;
        const classes = parseInt(course.classes, 10) || 1;
        const courseTotal = fee * classes;
        
        updatedCourses[courseKey] = {
          ...course,
          total: courseTotal
        };
        
        totalAmount += courseTotal;
      } else {
        updatedCourses[courseKey] = {
          ...course,
          total: 0
        };
      }
    });
    
    req.body.courses = updatedCourses;
    req.body.totalAmount = totalAmount;
  }

  student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: student
  });
});

// @desc    Delete student
// @route   DELETE /api/v1/students/:id
// @access  Private/Admin
exports.deleteStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return next(
      new ErrorResponse(`Student not found with id of ${req.params.id}`, 404)
    );
  }

  await student.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
