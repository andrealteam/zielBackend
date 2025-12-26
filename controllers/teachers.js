const Teacher = require('../models/Teacher');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register teacher
// @route   POST /api/v1/auth/teachers/register
// @access  Public
exports.registerTeacher = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, password, contactNo, address, teacherType, subjects } = req.body;

    // Validate required fields
    if (!name || !email || !password || !contactNo || !address || !teacherType) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return next(new ErrorResponse('Teacher already exists with this email', 400));
    }

    // Create teacher
    const teacher = await Teacher.create({
      name,
      email,
      password,
      contactNo,
      address,
      teacherType,
      subjects: subjects || {}
    });

    if (!teacher) {
      return next(new ErrorResponse('Failed to create teacher', 500));
    }

    // Send token response with teacher data
    sendTokenResponse(teacher, 201, res);
  } catch (error) {
    console.error('Error in registerTeacher:', error);
    next(new ErrorResponse('Server error during registration', 500));
  }
});

// @desc    Login teacher
// @route   POST /api/v1/auth/teachers/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for teacher
  const teacher = await Teacher.findOne({ email }).select('+password');

  if (!teacher) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await teacher.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(teacher, 200, res);
});

// @desc    Get current logged in teacher
// @route   GET /api/v1/auth/teachers/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.teacher.id);
  res.status(200).json({
    success: true,
    data: teacher
  });
});

// @desc    Get all teachers (Admin)
// @route   GET /api/v1/teachers
// @access  Private/Admin
exports.getTeachers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single teacher (Admin)
// @route   GET /api/v1/teachers/:id
// @access  Private/Admin
exports.getTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return next(
      new ErrorResponse(`Teacher not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: teacher });
});

// @desc    Update teacher
// @route   PUT /api/v1/teachers/:id
// @access  Private
exports.updateTeacher = asyncHandler(async (req, res, next) => {
  let teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return next(
      new ErrorResponse(`Teacher not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is teacher owner or admin
  if (teacher._id.toString() !== req.teacher.id && req.teacher.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.teacher.id} is not authorized to update this teacher`,
        401
      )
    );
  }

  teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: teacher });
});

// @desc    Delete teacher
// @route   DELETE /api/v1/teachers/:id
// @access  Private/Admin
exports.deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return next(
      new ErrorResponse(`Teacher not found with id of ${req.params.id}`, 404)
    );
  }

  await teacher.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (teacher, statusCode, res) => {
  try {
    if (!teacher || !teacher._id) {
      throw new Error('Teacher data is invalid');
    }

    // Create token
    const token = teacher.getSignedJwtToken();

    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    const responseData = {
      success: true,
      token,
      role: teacher.role || 'teacher',
      id: teacher._id.toString()
    };

    res
      .status(statusCode)
      .cookie('token', token, options)
      .json(responseData);
  } catch (error) {
    console.error('Error in sendTokenResponse:', error);
    res.status(500).json({
      success: false,
      error: 'Error generating authentication token'
    });
  }
};
