const express = require('express');
const router = express.Router();
const { registerTeacher, login } = require('../controllers/teachers');

// Public auth routes
router.post('/teachers/register', registerTeacher);
router.post('/teachers/login', login);

module.exports = router;
