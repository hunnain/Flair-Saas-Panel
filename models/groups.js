const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const GroupSchema = new Schema({
    users:{
        type: Array,
        required: true
    },
    GroupName:{
        type: String,
        required: true,
    },
    created_at:{ type: Date, default: Date.now },
})

// KitchenSchema.index({ location: "2dsphere" });
const GroupModel = mongoose.model('group', GroupSchema);

module.exports  = GroupModel;