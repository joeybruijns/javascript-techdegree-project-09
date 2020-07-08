'use strict'

const authenticateUser = require('./authentication/authenticateUser');
const getAllUserEmail = require('./authentication/getAllUserEmail');

module.exports = {
    authenticateUser,
    getAllUserEmail
}
