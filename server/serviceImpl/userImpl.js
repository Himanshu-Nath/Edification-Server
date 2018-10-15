var consts = require('../util/constant');
require("../models/users");
var User = mongoose.model('userCollection');

var logger = log4js.getLogger('userImpl.js');

module.exports = {
    validateAdminToken : function ( token, callback ) {
        User.estimatedDocumentCount({token: token}, function(err, result) {
            if(err) {
                callback(false);
            }
            if(result > 0)
                callback(true);
            else
                callback(false);            
        })
    },

    validateUserToken : function ( token, callback ) {
        User.estimatedDocumentCount({token: token}, function(err, result) {
            if(err) {
                callback(false);
            }
            if(result > 0)
                callback(true);
            else
                callback(false);            
        })
    }
}