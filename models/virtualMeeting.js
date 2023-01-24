const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const VirtuaSchema = new Schema({
    invitationCardId:{
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        required: true,
        ref: 'InvitationCard',
    },
    invitationCreatorUserId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
    invitationAcceptorUserId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
    date:{ 
        type: Date, 
        required: true,
    },
    timezoneName:{ 
        type: String, 
        required: true,
    },
    meetingDate:{
        type: String, 
        required: true,
    },
    meetingTime:{
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
    created_at:{ type: Date, default: Date.now },
}, {versionKey: false}, {strict: false},)


const VirtualMeetingModel = mongoose.model('virtualmeetings', VirtuaSchema);

module.exports  = VirtualMeetingModel;