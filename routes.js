'use strict'

const express = require('express');
const router = express.Router();

const bcryptjs = require('bcryptjs');
const {check, validationResult} = require('express-validator');

const {models} = require('./db');
const {User, Course} = models;
const utilities = require('./utilities'); // TODO: use { } ???
const {authenticateUser} = utilities;

// handler function for the routes
function asyncHandler(callback) {
    return async (req, res, next) => {
        try {
            await callback(req, res, next);
        } catch (error) {
            // pass errors to the global error handler
            next(error);
        }
    }
}

/**********************************************************
 USER ROUTES
 *********************************************************/

// GET route - api/users
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;

    res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress
    });
    // TODO: update the JSON response
}));

// POST route - api/users
router.post('/users', [
    check('firstName')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide your first name'),
    check('lastName')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide your last name'),
    check('emailAddress')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide your email address'),
    check('password')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a password')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    // handle any validation errors
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

    res.location('/');
    // set status to 201 Created and end the response
    return res.status(201).end();
}));

/**********************************************************
 COURSES ROUTES
 *********************************************************/

// GET route - api/courses
router.get('/courses', asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt'] //TODO: do give back those attributes??
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'password']
                }
            }
        ]
    });

    res.json({courses});
    // TODO: build in a check??
}));

// GET route - api/courses/:id
router.get('/courses/:id', asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt'] //TODO: do give back those attributes??
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'password']
                }
            }
        ]
    });

    if (course) {
        res.json({course});
    } else {
        res.status(404);
    }
    // TODO: build in a check??
}));

// POST route - api/courses
router.post('/courses', authenticateUser, [
    check('title')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a title for the course'),
    check('description')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a course description')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    // handle any validation errors
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({errors: errorMessages});
    }

    const user = req.currentUser;

    // create a new course
    const course = req.body;
    await Course.create({
        title: course.title,
        description: course.description,
        estimatedTime: course.estimatedTime,
        materialsNeeded: course.materialsNeeded,
        userId: user.id
        // TODO: RESTORE THE DATABASE TO ORIGINAL STATE
    });

    res.location(`/courses/${course.id}`);
    // set status to 201 Created and end the response
    return res.status(201).end();
}));

// PUT route - api/courses/:id
router.put('/courses/:id', authenticateUser, [
    check('title')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a title for the course'),
    check('description')
        .exists({checkNull: true, checkFalsy: true})
        .withMessage('Please provide a course description')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    // handle any validation errors
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({errors: errorMessages});
    }

    const user = req.currentUser;

    // find and update the specified course
    const courseToUpdate = await Course.findByPk(req.params.id);

    const course = req.body;
    await courseToUpdate.update({
        title: course.title,
        description: course.description,
        estimatedTime: course.estimatedTime,
        materialsNeeded: course.materialsNeeded,
        userId: user.id
    });

    // set status to 201 Created and end the response
    return res.status(201).end();
}));

// DELETE route - api/courses/:id
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {

    // delete the specified course
    await Course.destroy({
        where: {
            id: req.params.id
        }
    });

    // set status to 204 No Content and end the response
    return res.status(204).end();
}));

module.exports = router;
