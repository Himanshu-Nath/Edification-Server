const nodemailer = require('nodemailer');
var logger = log4js.getLogger('email.js');
var keys = require('../util/keys');
var consts = require('../util/constant');

module.exports = {
    //Create Transport
    createTransport: function () {
        let transporter = nodemailer.createTransport({
            host: keys.EMAIL.host,
            port: keys.EMAIL.port,
            secure: keys.EMAIL.secure, // true for 465, false for other ports like 587 false
            auth: {
                type: keys.EMAIL.type,
                clientId: keys.EMAIL.clientId,
                clientSecret: keys.EMAIL.clientSecret,
            }
        });        
        return transporter;     
    },
    //Send Mail
    sendMail: function (transporter, mailOptions, callback) {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                logger.error("sendMail: Mail sending failed");
                callback(false);
            } else {
                logger.info("sendMail: Mail send successfully");
                callback(true);
            }
        });
    }
}