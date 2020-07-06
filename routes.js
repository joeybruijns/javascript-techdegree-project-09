'use strict'

const express = require('express');
const bcryptjs = require('bcryptjs');

const router = express.Router();

// GET - users
router.get('/users', (req, res) => {
    const user = req.currentUser;

    res.json({
        name: user.name,
        username: user.username,
    });
});

// POST - users
router.post('/users', (req, res) => {

});


module.exports = router;
