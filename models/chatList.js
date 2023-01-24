const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const chatListSchema = new Schema({
    messages: [{
        type: obj.ObjectId,
        ref : 'messages'
    }],
    unread: String,
    user_one: {
        userType: {
            type: String,
			default: 'User'
        },
        user: {
            type: obj.ObjectId,
            refPath : 'user_one.userType'
        },
		read_status: {
            type: Boolean,
			default: false
		}
    },
    user_two: {
        userType: {
            type: String,
			default: 'User'
        },
        user: {
            type: obj.ObjectId,
            refPath : 'user_two.userType'
        },
		read_status: {
            type: Boolean,
			default: false
		}
    },
    name: {
        type: String,
    },
    date: { 
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})


const chatListModel = mongoose.model('chatlist', chatListSchema);

module.exports  = chatListModel;