const jwt = require('jsonwebtoken');
const fs = require('fs');

module.exports = {    
    getJWTToken : function(dataObj, privateKey) {
        let token = jwt.sign(dataObj, privateKey, { algorithm: 'RS384', expiresIn: '1h' });
        return token;
    },

    readKeyFile: function(path) {
        return fs.readFileSync(path);
    },

    verifyJWTToken: function(token) {

    }
};