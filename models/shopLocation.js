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
		coordinates: {
            type: [Number],
            required: true,
            validate: {
              validator: (coords) => coords.length === 2 && coords.every((c) => !isNaN(c)),
              message: 'Invalid coordinates',
            },
          }
	},
    openingHours: {
        type: [
            {
                dayOfWeek: {
                    type: String,
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                    required: true
                },
                startTime: {
                    type: String,
                    required: true,
                    validate: {
                        validator: function(v) {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                        },
                        message: props => `${props.value} is not a valid time format.`
                    },
                },
                endTime: {
                    type: String,
                    required: true,
                    validate: {
                        validator: function(v) {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                        },
                        message: props => `${props.value} is not a valid time format.`
                    },
                },
                closed: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        validate: {
            validator: (hours) => hours.length === 7,
            message: 'Opening hours must be specified for all days of the week',
        },
    },
    created_at:{ type: Date, default: Date.now },
}, {versionKey: false}, {strict: false},)

shopBranchesSchema.index({ location: "2dsphere" });
const ShopBranchesModel = mongoose.model('shopbranches', shopBranchesSchema);

module.exports  = ShopBranchesModel;