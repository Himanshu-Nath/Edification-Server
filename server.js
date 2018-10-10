const express = require('express');
const path = require('path');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const consts = require('./server/util/constant');
mongoose = require('mongoose');
log4js = require('log4js');
async = require('async');
jwt = require('jsonwebtoken');
require('./server/config/db');
const app = express();

log4js.configure({
    appenders: {
        'file': { type: 'file', filename: 'log/server.log' },
        'console': { type: 'console' }
    },
    categories: { 'default': { appenders: ['file', 'console'], level: 'info' } }
});
const logger = log4js.getLogger('server.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var User = require('./server/routes/users');

app.get('/api/mobile/googletokenverify', User.googleTokenVerification);
app.post('/api/mobile/user', User.registerUser);
app.post('/api/mobile/userlogin', User.loginUser);

app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.listen(consts.PORT, function () {
    logger.info("Server is running at port: " + consts.PORT);
    // logger.warn("Server is running at port: " + consts.PORT);
    // logger.error("Server is running at port: " + consts.PORT);
    // logger.fatal("Server is running at port: " + consts.PORT);
})