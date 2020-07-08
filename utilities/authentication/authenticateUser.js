'use strict'

const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

const {models} = require('../../db');
const {User, Course} = models;

/*
    Function for checking if the user is authenticated or not
*/
const authenticateUser = async (req, res, next) => {
    let notAuthenticated = null;

    const userCredentials = auth(req);

    if (userCredentials) {
        const user = await User.findOne({
            where: {
                emailAddress: userCredentials.name
            }
        });

        if (user) {
            const authenticated = bcryptjs.compareSync(userCredentials.pass, user.password);

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

module.exports = authenticateUser;
