'use strict'

const express = require('express');
const bcryptjs = require('bcryptjs');
const {check, validationResult} = require('express-validator');
const basicAuth = require('basic-auth');

const {models} = require('./db');
const {User, Course} = models;

const router = express.Router();

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

// TODO: move this function to helper function folder?
// check if a user is authenticated
const authenticateUser = (req, res, next) => {
    let notAuthenticated = null;

    const userCredentials = basicAuth(req);

    if (userCredentials) {
        const user = User.get(user => user.emailAddress === userCredentials.emailAddress);

        if (user) {
            const authenticated = bcryptjs.compareSync(user.password, userCredentials.password);

            if (authenticated) {
                req.currentUser = user;
            } else {
                notAuthenticated = `Authentication failure for username: ${user.emailAddress}`;
            }
        } else {
            notAuthenticated = `No user found for ${user.emailAddress}`;
        }
    } else {
        notAuthenticated = 'Authentication header not found..';
    }

    // return 401 - Unauthorized if user authentication failed
    if (notAuthenticated) {
        console.warn(notAuthenticated);
        res.status(401).json({message: 'Access Denied'});
    } else {
        next();
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
