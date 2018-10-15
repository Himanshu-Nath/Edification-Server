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

var userImpl = require('./server/serviceImpl/userImpl');

app.use(function (req, res, next) {
    logger.info("URL: " + req.url);
    if (req.url.includes("admin")) {
        if (req.url == "/api/admin/register" || req.url == "/api/admin/login") {
            next();
        } else {
            userImpl.validateAdminToken(req.get(consts.AUTH_TOKEN), function (response) {
                if (response) {
                    next();
                } else {
                    res.status(401).send({ status: false, message: consts.FAIL, devMsg: "Unauthorized" });
                }
            })
        }
    } else if(req.url.includes("user")){
        if (req.url == "/api/user/googletokenverify" || req.url == "/api/user/register" || req.url == "/api/user/login"
            || req.url == "/api/user/forgotpassword" || req.url == '/api/user/otpverification' ) {
            next();
        } else {
            userImpl.validateUserToken(req.get(consts.AUTH_TOKEN), function (response) {
                if (response) {
                    next();
                } else {
                    res.status(401).send({ status: false, message: consts.FAIL, devMsg: "Unauthorized" });
                }
            })
        }
    }
});

var User = require('./server/routes/users');

app.get('/api/user/googletokenverify', User.googleTokenVerification);
app.post('/api/user/register', User.registerUser);
app.post('/api/user/login', User.loginUser);
app.post('/api/user/forgotpassword', User.forgotPassword);
app.post('/api/user/otpverification', User.otpVerification);

app.post('/api/admin/register', User.registerAdmin);
app.post('/api/admin/login', User.loginAdmin);

app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.listen(consts.PORT, function () {
    logger.info("Server is running at port: " + consts.PORT);
    // logger.warn("Server is running at port: " + consts.PORT);
    // logger.error("Server is running at port: " + consts.PORT);
    // logger.fatal("Server is running at port: " + consts.PORT);
})