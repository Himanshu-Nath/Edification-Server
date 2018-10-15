const uuidv1 = require('uuid/v1');
const { OAuth2Client } = require('google-auth-library');
const randomize = require('randomatic');
const Promise = require('promise');
const fs = require('fs');
const consts = require('../util/constant');
const utils = require('../util/utils');
const keys = require('../util/keys');
const twilio = require('twilio')(keys.TWILIO_ACCOUNTSID, keys.TWILIO_AUTHTOKEN);
const emailImpl = require('../serviceImpl/emailImpl');

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
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "User Registered Failed", err});
            } else {
                if(result != null) {
                    res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "User Registration Sucess"});
                }
            }
        });
    },

    loginUser: function(req, res) {
        let privateKey = utils.readKeyFile(__dirname + '/../' + keys.PRIVATE_KEY_PATH);
        let userDetails = req.body;
        User.countDocuments({email: userDetails.email, password: userDetails.password, role: consts.ROLE_USER, status: true}).exec()
        .then(function(count) {
            if(count > 0) {
                let token = utils.getJWTToken({ email: userDetails.email, password: userDetails.password }, privateKey);
                User.findOneAndUpdate({ email: userDetails.email }, { $set: { token: token } }, { projection: {__v:0, password: 0, token: 0} }, function(err, result) {
                    if(err) {
                        logger.error("loginUser: Error due to: "+err);
                        res.status(500).send({status: false, message: consts.FAIL, devMessage: "User Login Failed", err});
                    } else {
                        res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "User Login Sucess", token: token, result});
                    }                    
                });
            } else {
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "User Invalid Email And Password"});
            }            
        })
        .then(undefined, function(err){
            logger.error("loginUser: Error due to: "+err);
            res.status(403).send({status: false, message: consts.FAIL, devMessage: "User Login error", err});
        });
    },

    forgotPassword: function(req, res) {
        let userDetails = req.body;
        let otp = randomize('0', 6);
        User.countDocuments({email: userDetails.email, mobile: Number(userDetails.mobile)}).exec()
        .then(function(count) {
            var data = [];
            if(count > 0) {
               return User.findOneAndUpdate({ email: userDetails.email, mobile: userDetails.mobile }, { $set: { otp: otp, status: false, password: null } }, { projection: {__v:0, password: 0, token: 0} }, function(err, result) {
                    if(err) {
                        logger.error("forgotPassword: Error due to: "+err);
                        res.status(500).send({status: false, message: consts.FAIL, devMessage: "Login Failed", err});
                    }
                });
            } else {
                res.status(403).send({status: false, message: consts.FAIL, devMessage: "Invalid Email And Moabile"});
            }            
        })
        .then(function(result) {
            if(result != null) {
                let emailSend;
                let smsSend;

                //Sending email otp
                var emailObject = {
                    name: result.name,
                    from: keys.EMAIL.user,
                    from_name: keys.EMAIL.from,
                    to: userDetails.email,
                    subject: "Edification OTP ✔",
                    body: 'Hello &nbsp;' + result.name + ',<br><br><p></p><p>Looks like you had like to change your <b>Edification</b> password. Please find below the OTP to change password:</p><p><i><b>OTP:</b></i> <b>'+ otp +'</b>.</p><p>This message was generated automatically. Please disregard this e-mail if you did not request a password reset. Cheers,</p><p>If you need help or have questions, email hnath723@gmail.com anytime.</p> <br> <p>Sincerely, <br>Himanshu Nath <br>Edification Team</p>'
                }
                emailImpl.sendMail(emailObject, function(status) {
                    emailSend = status;
                    if(emailSend)
                        logger.error("forgotPassword: OTP successfully send via email: "+err);
                });

                //Sending mobile otp
                twilio.messages
                .create({
                   body: 'Edification forgot password OTP is: '+otp,
                   from: keys.TWILIOFROM,
                   to: keys.TWILIOTO
                 })
                .then(message => smsSend = true)
                .done();
                res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "OTP generated successfully", otp: otp});
            }
        })
        .catch(function(err){
            logger.error("loginUser: Error due to1: "+err);
            res.status(500).send({status: false, message: consts.FAIL, devMessage: "Login error", err});
        });
    },

    otpVerification: function(req, res) {
        let userDetails = req.body;
        let deviceId = req.get(consts.DEVICE_ID);
        User.findOneAndUpdate({ otp: userDetails.otp, device_id: deviceId }, { $set: { otp: null, status: true, password: userDetails.password } }, { projection: {__v:0, password: 0, token: 0} }, function(err, result) {
            if(err) {
                logger.error("otpVerification: Error due to: "+err);
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "OTP Verification Failed", err});
            } else {
                if(result != null) {
                    res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "OTP Validated Successfully"});
                } else {
                    logger.error("otpVerification: Error due to: "+err);
                    res.status(500).send({status: false, message: consts.FAIL, devMessage: "OTP not found"});
                }
            }
        });
    },

    registerAdmin: function(req, res) {
        let adminDetails = req.body;
        var user = new User({
            name: adminDetails.name,
            email: adminDetails.email,
            password: adminDetails.password,
            role: "Admin",
            login_type: "Web",
            status: true,
        });
        user.save(function(err, result){
            if(err) {
                logger.error("registerAdmin: Error due to: "+err);
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "Admin Registered Failed", err});
            } else {
                if(result != null) {
                    res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "Admin Registration Sucess"});
                }                
            }
        });
    },

    loginAdmin: function(req, res) {
        let privateKey = utils.readKeyFile(__dirname + '/../' + keys.PRIVATE_KEY_PATH);
        let adminDetails = req.body;
        User.estimatedDocumentCount({email: adminDetails.email, password: adminDetails.password, role: consts.ROLE_ADMIN, status: true}).exec()
        .then(function(count) {
            if(count > 0) {
                let token = utils.getJWTToken({ email: adminDetails.email, password: adminDetails.password }, privateKey);
                User.findOneAndUpdate({ email: adminDetails.email }, { $set: { token: token } }, { projection: {__v:0, password: 0, token: 0} }, function(err, result) {
                    if(err) {
                        logger.error("loginAdmin: Error due to: "+err);
                        res.status(500).send({status: false, message: consts.FAIL, devMessage: "Admin Login Failed", err});
                    } else {
                        res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "Admin Login Sucess", token: token, result});
                    }                    
                });
            } else {
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "Invalid Admin Email And Password"});
            }            
        })
        .then(undefined, function(err){
            logger.error("loginAdmin: Error due to: "+err);
            res.status(403).send({status: false, message: consts.FAIL, devMessage: "Admin Login error", err});
        });
    },

}