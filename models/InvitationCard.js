const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const invitationCardSchema = new Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    date:{ 
        type: Date, 
        required: true,
    },
    timezoneName:{ 
        type: String, 
        required: true,
    },
    invitationDate:{
        type: String, 
        required: true,
    },
    invitationTime:{
        type: String, 
        required: true,
    },
    isBooked:{
        type: Boolean,   
    },
    location: {
		type: {
			type: String,
			default: "Point"
		},
		address: { type: String, },
		coordinates: [ Number ],
	},
    created_at      : { type: Date, default: Date.now },
})

invitationCardSchema.index({ location: "2dsphere" });
const invitationCardModel = mongoose.model('InvitationCard', invitationCardSchema);

module.exports  = invitationCardModel;