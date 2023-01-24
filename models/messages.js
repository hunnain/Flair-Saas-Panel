const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const MessageSchema = new Schema({

    sender:{
        type : Schema.Types.ObjectId,
        ref : 'user',
        required:true
    },
    reciever:{
        type : Schema.Types.ObjectId,
        ref : 'user',
        required:true
    },
    channel:{
        type:String,
        required:true
    },
    text:{
        type:String
    },
    read:{
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now()
    }
    })
    

const messagesModel = mongoose.model('messages', MessageSchema);

module.exports  = messagesModel;