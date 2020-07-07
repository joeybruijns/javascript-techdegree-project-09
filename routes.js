'use strict'

const express = require('express');
const router = express.Router();

const bcryptjs = require('bcryptjs');
const {check, validationResult} = require('express-validator');

const {models} = require('./db');
const {User, Course} = models;
const utilities = require('./utilities');
const {authenticateUser} = utilities;

// handler function for the routes
function asyncHandler(callback) {
    return async (req, res, next) => {
        try {
            await callback(req, res, next);
        } catch (error) {
            res.status(500);
        }
    }
}

// GET route - api/users
router.get('/users', authenticateUser, (req, res) => {
    const user = req.currentUser;

    res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress
    });
});

// POST route - api/users
router.post('/users', [
    check('firstName')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a value for "first name"'),
    check('lastName')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a value for "last name"'),
    check('emailAddress')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a value for "email address"'),
    check('password')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a value for "password"')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    // if there are any validation errors, handle them
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({errors: errorMessages});
    }

    // create the new user
    const user = req.body;
    await User.create({
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        password: bcryptjs.hashSync(user.password)
    });

    // set status to 201 Created and end the response
    res.location('/');
    return res.status(201).end();
}));

// GET route - api/courses

// POST route - api/courses

// PUT route - api/courses

// DELETE route - api/courses


module.exports = router;
