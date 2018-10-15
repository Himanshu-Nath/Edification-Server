var Schema = mongoose.Schema;

var InstituteSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String},
    about: {
        leadership: String,
        faculty: String,
        syllabus: String,
        exam_system: String,
        facility: String,
        activity: String
    },
    admission: {
        about: String,
        eligibility: String,
        fees: String
    },
    gallery: [],
    downloads: [],
    contact: {
        address: String, 
        city: String, 
        state: String, 
        zipcode: Number, 
        phone: [], 
        web_site: String,
        email: String,
        facebook: String,
        twitter: String,
        latitude: Number,
        longitude: Number
    },
    institute_type: {type: String, required: true},
    ranking: {type: Number},
    google_rating: {type: Number},
    like: [{userId: String, review: Number}],
    comment: [{userId: String, message: String}],
    status: {type: Boolean, required: true},
    creation_time: {type: String, default: Date.now, required: true},
    modification_time: {type: String, default: Date.now, required: true}
}, {collection: 'institute'});
mongoose.model('instituteCollection', InstituteSchema);