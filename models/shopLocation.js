const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const shopBranchesSchema = new Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    locationBanner:{ 
        type: String, 
        default: "https://cdn3.vectorstock.com/i/thumb-large/32/12/default-avatar-profile-icon-vector-39013212.jpg",
    },
    locationName:{
        type: String, 
        required: true,
    },
    locationCountry:{ 
        type: String, 
        required: true,
    },
    locationCity:{
        type: String, 
        required: true,
    },
    locationStreet:{
        type: String, 
        required: true,
    },
    locationPostalCode:{
        type: String, 
        required: true,
    },
    location: {
		type: {
			type: String,
			default: "Point"
		},
		address: { type: String, },
		coordinates: [ Number ],
	},
    monday:{
        startAt:String,
        endAt:String
    },
    tuesday:{
        startAt:String,
        endAt:String
    },
    wednesday:{
        startAt:String,
        endAt:String
    },
    thursday:{
        startAt:String,
        endAt:String
    },
    friday:{
        startAt:String,
        endAt:String
    },
    saturday:{
        startAt:String,
        endAt:String
    },
    sunday:{
        startAt:String,
        endAt:String
    },
    created_at:{ type: Date, default: Date.now },
}, {versionKey: false}, {strict: false},)

shopBranchesSchema.index({ location: "2dsphere" });
const ShopBranchesModel = mongoose.model('shopbranches', shopBranchesSchema);

module.exports  = ShopBranchesModel;