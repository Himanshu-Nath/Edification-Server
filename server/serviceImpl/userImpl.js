var consts = require('../util/constant');
var utils = require('../util/utils');
var keys = require('../util/keys');
require("../models/users");
var User = mongoose.model('userCollection');

var logger = log4js.getLogger('userImpl.js');

module.exports = {
    validateAdminToken : function ( token, callback ) {
        let publicKey = utils.readKeyFile(__dirname + '/../' + keys.PUBLIC_KEY_PATH);
        utils.verifyJWTToken(token, publicKey, function(result) {
            if(result.status) {
                User.countDocuments({token: token, role: consts.ROLE_ADMIN}, function(err, result) {
                    if(err) {
                        callback({status: false, error: "DB error"});
                    } else {
                        if(result > 0)
                            callback({status: true, error: "Token Authenticated"});
                        else
                            callback({status: false, error: "Token not found: Unauthorized"});
                    }            
                })
            } else {
                callback({status: false, error: result.error});
            }                
        });        
    },

    validateUserToken : function ( token, callback ) {       
        let publicKey = utils.readKeyFile(__dirname + '/../' + keys.PUBLIC_KEY_PATH);
        utils.verifyJWTToken(token, publicKey, function(result) {
            if(result.status) {
                User.countDocuments({token: token, role: consts.ROLE_USER}, function(err, result) {
                    if(err) {
                        callback({status: false, error: "DB error"});
                    } else {
                        if(result > 0)
                            callback({status: true, error: "Token Authenticated"});
                        else
                            callback({status: false, error: "Token not found: Unauthorized"});
                    }            
                })
            } else {
                callback({status: false, error: result.error});
            }                
        }); 
    }
}