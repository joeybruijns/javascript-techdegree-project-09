'use strict'

const express = require('express');
const router = express.Router();

const bcryptjs = require('bcryptjs');
const {check, validationResult} = require('express-validator');

const {models} = require('./db');
const {User, Course} = models;
const utilities = require('./utilities');
const {authenticateUser, getAllUserEmail} = utilities;

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
router.get('/users', authenticateUser, asyncHandler(async (req, res, next) => {
    const user = req.currentUser;

    if (user) {
        res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress
        });
    } else {
        // handle errors
        next();
    }
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
        .isEmail()
        .withMessage('Please provide a valid email address'),
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

    const user = req.body;

    // check if the email is already in use
    const userEmail = getAllUserEmail();
    if ((await userEmail).includes(user.emailAddress)) {
        return res.status(400).json({errors: 'Email is already in use'});
    }

    // create the new user
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
router.get('/courses', asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
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

    if (courses) {
        res.json({courses});
    } else {
        // handle errors
        next();
    }
}));

// GET route - api/courses/:id
router.get('/courses/:id', asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt']
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
        // handle errors
        next();
    }
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
    const course = req.body;

    // create a new course
    const newCourse = await Course.create({
        title: course.title,
        description: course.description,
        estimatedTime: course.estimatedTime,
        materialsNeeded: course.materialsNeeded,
        userId: user.id
    });

    res.location(`/courses/${newCourse.id}`);

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
], asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    // handle any validation errors
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({errors: errorMessages});
    }

    const user = req.currentUser;
    const courseToUpdate = await Course.findByPk(req.params.id);

    if (courseToUpdate) {
        // check if the user is authorized to update this course
        if (courseToUpdate.userId === user.id) {
            const course = req.body;
            await courseToUpdate.update({
                title: course.title,
                description: course.description,
                estimatedTime: course.estimatedTime,
                materialsNeeded: course.materialsNeeded,
                userId: user.id
            });

            // set status to 204 No Content and end the response
            return res.status(204).end();
        } else {
            return res.status(403).json({errors: "User is not authorized"});
        }
    } else {
        // handle errors
        next();
    }
}));

// DELETE route - api/courses/:id
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {

    const user = req.currentUser;
    const courseToDelete = await Course.findByPk(req.params.id);

    if (courseToDelete) {
        // check if the user is authorized to delete this course
        if (courseToDelete.userId === user.id) {
            courseToDelete.destroy();

            // set status to 204 No Content and end the response
            return res.status(204).end();
        } else {
            return res.status(403).json({errors: "User is not authorized"});
        }
    } else {
        // handle errors
        next();
    }
}));

module.exports = router;
