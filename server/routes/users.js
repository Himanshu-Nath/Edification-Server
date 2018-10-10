const uuidv1 = require('uuid/v1');
const { OAuth2Client } = require('google-auth-library');
const consts = require('../util/constant');
const utils = require('../util/utils');
const keys = require('../util/keys');
const randomize = require('randomatic');
var Promise = require('promise');
const fs = require('fs');

require('../models/users');
var User = mongoose.model('userCollection');

var logger = log4js.getLogger('users.js');

module.exports = {
    googleTokenVerification: function(req, res) {
        const client = new OAuth2Client(keys.GOOGLE_CLIENT_ID);
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: req.query.idToken,
                audience: keys.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const userid = payload['sub'];
            console.log(payload);
            User.findOne({google_user_id: payload['sub'], email: payload['email']}, function(err, result) {
                if(err){
                    logger.error("googleTokenVerification: Error due to: "+err);
                    res.status(500).send({status: false, message: consts.FAIL, devMessage: "Google Varification Failed", err});
                } else {                    
                    let token = utils.getJWTToken({ email: payload['email'], google_user_id: payload['sub'] });
                    jwt.sign({project: "Battle APIs", company: "Instarem"}, constant.PRIVATE_KEY, { expiresIn: '1h' },(err, token) => {
                        if(err) { logger.info('getBattleStats: successfully token generated'); }    
                        res.send({ status: true, message: constant.success, token });
                    });                
                    if(result != null) {
                        result.name = payload['name'] || result.name
                        result.email = payload['email'] || result.email
                        result.mobile = payload['mobile'] || result.mobile
                        result.role = "User" || result.role
                        result.google_user_id = payload['sub'] || result.google_user_id
                        result.device_id = req.query.deviceId || result.device_id
                        result.login_type = "Google" || result.login_type
                        result.status = true || result.status
                        result.image = payload['picture'] || result.image,
                        result.access_token = token
                        result.save(function(err, result){
                            if(err) {
                                logger.error("googleTokenVerification: Error due to: "+err);
                                res.status(500).send({status: false, message: consts.FAIL, devMessage: "User Record Updation Failed", err});
                            } else {
                                if(result != null) {
                                    res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "User Record Updated Successfully"});
                                } else {
                                    logger.error("googleTokenVerification: Error due to: "+err);
                                    res.status(500).send({status: false, message: consts.FAIL, devMessage: "User Record Updation Failed"});
                                }                
                            }
                        });
                    } else {
                        var user = new User({
                            name: payload['name'],
                            email: payload['email'],
                            mobile: payload['mobile'],
                            role: "User",
                            google_user_id: payload['sub'],
                            device_id: req.query.deviceId,
                            login_type: "Google",
                            status: true,
                            image: payload['picture'],
                            access_token: token
                        });
                        user.save(function(err, result){
                            if(err) {
                                logger.error("googleTokenVerification: Error due to: "+err);
                                res.status(500).send({status: false, message: consts.FAIL, devMessage: "User Record Addition Failed", err});
                            } else {
                                if(result != null) {
                                    res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "User Record Addition Successfully Done", token: token});
                                } else {
                                    logger.error("googleTokenVerification: Error due to: "+err);
                                    res.status(500).send({status: false, message: consts.FAIL, devMessage: "User Record Addition Failed"});
                                }                
                            }
                        });
                    }
                }
            })
        }        
        verify().catch(console.error);
    },

    registerUser: function(req, res) {
        let userDetails = req.body;
        var user = new User({
            name: userDetails.name,
            email: userDetails.email,
            password: userDetails.password,
            mobile: userDetails.mobile,
            role: "User",
            device_id: userDetails.deviceId,
            login_type: "Default",
            status: true,
        });
        user.save(function(err, result){
            if(err) {
                logger.error("registerUser: Error due to: "+err);
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "Registered Failed", err});
            } else {
                if(result != null) {
                    res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "Registration Sucess"});
                }                
            }
        });
    },

    loginUser: function(req, res) {
        let privateKey = utils.readKeyFile(__dirname + '/../' + keys.PRIVATE_KEY_PATH);
        let userDetails = req.body;
        User.countDocuments({email: userDetails.email, password: userDetails.password, status: true})
        .then(function(count) {
            if(count > 0) {
                let token = utils.getJWTToken({ email: userDetails.email, password: userDetails.password }, privateKey);
                User.findOneAndUpdate({ email: userDetails.email }, { $set: { token: token } }, { projection: {__v:0, password: 0, token: 0} }, function(err, result) {
                    if(err) {
                        logger.error("loginUser: Error due to: "+err);
                        res.status(500).send({status: false, message: consts.FAIL, devMessage: "Login Failed", err});
                    } else {
                        res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "Login Sucess", token: token, result});
                    }                    
                });
            } else {
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "Invalid Email And Password"});
            }            
        })
        .then(undefined, function(err){
            logger.error("loginUser: Error due to: "+err);
            res.status(403).send({status: false, message: consts.FAIL, devMessage: "Login error", err});
        });
    },

    forgotPassword: function(req, res) {
        let userDetails = req.body;
        let otp = randomize('0', 6);
        User.countDocuments({email: userDetails.email, mobile: userDetails.mobile})
        .then(function(count) {
            if(count > 0) {                
                User.findOneAndUpdate({ email: userDetails.email, mobile: userDetails.mobile }, { $set: { otp: otp, status: false, password: null } }, { projection: {__v:0, password: 0, token: 0} }, function(err, result) {
                    console.log(result);
                    if(err) {
                        logger.error("forgotPassword: Error due to: "+err);
                        res.status(500).send({status: false, message: consts.FAIL, devMessage: "Login Failed", err});
                    }
                });
            } else {
                res.status(403).send({status: false, message: consts.FAIL, devMessage: "Invalid Email And Moabile"});
            }            
        })
        .then(function(count) {
            if(count > 0) {
                User.findOneAndUpdate({ email: userDetails.email, mobile: userDetails.mobile }, { $set: { otp: otp, status: false, password: null } }, { projection: {__v:0, password: 0, token: 0} }, function(err, result) {
                    console.log(result);
                    if(err) {
                        logger.error("forgotPassword: Error due to: "+err);
                        res.status(500).send({status: false, message: consts.FAIL, devMessage: "Login Failed", err});
                    }
                });
            } else {
                res.status(403).send({status: false, message: consts.FAIL, devMessage: "Invalid Email And Moabile"});
            }            
        })
        .then(undefined, function(err){
            logger.error("loginUser: Error due to: "+err);
            res.status(500).send({status: false, message: consts.FAIL, devMessage: "Login error", err});
        });
    }


}