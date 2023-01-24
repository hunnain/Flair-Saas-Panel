const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const userFreeTimeSchema = new Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
        unique: true
    },
    monday:{
        type: Array,
    },
    tuesday:{
        type: Array,
    },
    wednesday:{
        type: Array,
    },
    thursday:{
        type: Array,
    },
    friday:{
        type: Array,
    },
    saturday:{
        type: Array,
    },
    sunday:{
        type: Array,
    },
    created_at:{ type: Date, default: Date.now },
}, {versionKey: false}, {strict: false},)


const UserFreeTimeModel = mongoose.model('FreeTime', userFreeTimeSchema);

module.exports  = UserFreeTimeModel;