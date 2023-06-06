const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const Schema    = mongoose.Schema;

const blockTimeSchema = new mongoose.Schema({
    shopAdminAccountId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'shopsadminaccount',
    },
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    description: {
      type: String
    }
  });
  
  const BlockTime = mongoose.model('BlockTime', blockTimeSchema);
  
  module.exports = BlockTime;