const jwt = require('jsonwebtoken');
const fs = require('fs');

var logger = log4js.getLogger('utils.js');

module.exports = {    
    getJWTToken : function(dataObj, privateKey) {
        let token = jwt.sign(dataObj, privateKey, { algorithm: 'RS384', expiresIn: '1h' });
        return token;
    },

    verifyJWTToken : function(token, publicKey, callback) {
        jwt.verify(token, publicKey, (err, authorizedData) => {
            if(err){
                //If error send Forbidden (403)
                logger.error(err);
                callback({status: false, error: "Token Expire"});
            } else {
                callback({status: true, error: "Valid Expire"});
            }
        });
    },

    readKeyFile: function(path) {
        return fs.readFileSync(path);
    },
};