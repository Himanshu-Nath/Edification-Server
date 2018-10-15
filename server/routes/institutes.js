const Promise = require('promise');
const multer = require('multer');
const fs = require('fs');
const consts = require('../util/constant');
const utils = require('../util/utils');

require('../models/institutes');
var Institute = mongoose.model('instituteCollection');

var logger = log4js.getLogger('institutes.js');

var storage	=	multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, './uploads');
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
    }
});

var upload = multer({  storage: storage }).fields([
    { name: 'gallery', maxCount: 10 }, 
    { name: 'document', maxCount: 30 }]);

module.exports = {

    addInstitute: function(req, res) {
        upload(req, res,function(err){
            // console.log(req.get(consts.AUTH_TOKEN));            
            if(err){
                logger.error('addinstitute: Error due to: ' + err);
                res.status(500).send({status: false, message: consts.FAIL, devMessage: "Failed to add new institute", err});
            } else {
                let instituteDetails = req.body;
                var institute = new Institute({
                    name: instituteDetails.name,
                    description: instituteDetails.description,
                    "about.leadership": instituteDetails.about_leadership,
                    "about.faculty": instituteDetails.about_faculty,
                    "about.syllabus": instituteDetails.about_syllabus,
                    "about.exam_system": instituteDetails.about_exam_system,
                    "about.facility": instituteDetails.about_facility,
                    "about.activity": instituteDetails.about_activity,

                    "admission.about": instituteDetails.admission_about,
                    "admission.eligibility": instituteDetails.admission_eligibility,
                    "admission.fees": instituteDetails.admission_fees,

                    "contact.address": instituteDetails.contact_address,
                    "contact.city": instituteDetails.contact_city,
                    "contact.state": instituteDetails.contact_state,
                    "contact.zipcode": instituteDetails.contact_zipcode,
                    "contact.phone": instituteDetails.contact_phone,
                    "contact.web_site": instituteDetails.contact_web_site,
                    "contact.email": instituteDetails.contact_email,
                    "contact.facebook": instituteDetails.contact_facebook,
                    "contact.twitter": instituteDetails.contact_twitter,
                    "contact.latitude": instituteDetails.contact_latitude,
                    "contact.longitude": instituteDetails.contact_longitude,

                    institute_type: instituteDetails.instituteType,
                    ranking: instituteDetails.ranking,
                    google_rating: instituteDetails.googleRating,
                    status: true,
                });

                if(req.files != undefined) {
                    if("gallery" in req.files) {
                        for(file in req.files.gallery) {
                            institute.gallery.push(req.files.gallery[file].filename);
                        }                        
                    }
                    if("document" in req.files) {
                        for(file in req.files.document) {
                            institute.downloads.push(req.files.document[file].filename);
                        }                        
                    }
                }
                institute.save(function(err, result){
                    if(err) {
                        logger.error("addInstitute: Error due to: "+err);
                        res.status(500).send({status: false, message: consts.FAIL, devMessage: "Institute addition Failed", err});
                    } else {
                        if(result != null) {
                            res.status(200).send({status: true, message: consts.SUCCESS, devMessage: "Institute addition Sucess"});
                        }                
                    }
                });
            }
        });        
    },

    instituteList: function(req, res) {

    }

}