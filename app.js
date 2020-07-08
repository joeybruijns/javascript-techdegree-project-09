'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const routes = require('./routes');

const {sequelize, models} = require('./db');

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup request body JSON parsing
app.use(express.json());

// setup morgan which gives us http request logging
app.use(morgan('dev'));

console.log('Testing the connection to the database..');
(async () => {
    try {
        console.log("Database connection is successful!");
        await sequelize.authenticate();

        console.log('Synchronizing the models with the database...');
        await sequelize.sync();
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            console.error('Validation errors: ', errors);
        } else {
            throw error;
        }
    }
})();

// project root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the REST API project!',
    });
});

// adding all other routes
app.use('/api', routes);

// send 404 if no other route matched
app.use((req, res) => {
    res.status(404).json({
        message: 'Route Not Found',
    });
});

// setup a global error handler
app.use((err, req, res, next) => {
    if (enableGlobalErrorLogging) {
        console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
    }

    res.status(err.status || 500).json({
        message: err.message,
        error: {},
    });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
    console.log(`Express server is listening on port ${server.address().port}`);
});
