const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const notificationSchema = new Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    notificationTitle:{ 
        type: String, 
        required: true,
    },
    notificationMessage:{ 
        type: String, 
        required: true,
    },
    type:{
        type: String, 
        required: true,
    },
    id:{
        type: String, 
        required: true,
    },
    created_at      : { type: Date, default: Date.now },
})


const notificationModel = mongoose.model('notification', notificationSchema);

module.exports  = notificationModel;