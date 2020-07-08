'use strict'

const {models} = require('../../db');
const {User, Course} = models;

/*
    Get all the user email addresses from the database and return it as an array
*/
const getAllUserEmail = async () => {
    let emailAddresses = [];
    const courses = await User.findAll({
        attributes: {
            exclude: [ 'id', 'firstName', 'lastName', 'password', 'createdAt', 'updatedAt']
        },
    });

    courses.forEach(item => {
        emailAddresses.push(item.emailAddress);
    });

    console.log(emailAddresses);
    return emailAddresses;
}

module.exports = getAllUserEmail;
