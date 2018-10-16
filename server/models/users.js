const bcrypt = require('bcrypt');
const keys = require('../util/keys');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique : true},
    mobile: {type: Number},
    password: {type: String},
    token: {type: String},
    access_token: {type: String},
    image: {type: String},
    otp: {type: Number},
    login_type: {type: String},
    google_user_id: {type: Number},
    role: {type: String, required: true},
    device_id: {type: String},
    last_login: {type: String},
    status: {type: Boolean, required: true},
    creation_time: {type: String, default: Date.now, required: true},
    modification_time: {type: String, default: Date.now, required: true}
}, {collection: 'user_profile'});

// hash password
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, keys.SALT_ROUNDS);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

mongoose.model('userCollection', UserSchema);