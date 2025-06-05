const mongoose = require('mongoose')
const commentsSchema = new mongoose.Schema({
    comment:String,
    individualId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Individual' },
    timestamp: { type: Date, default: Date.now }
})

const forumSchema = new mongoose.Schema({
    forumTopic:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    isAllowed:{
        type:Boolean,
        required:false,
        default:false,
    },
    comments:{
        type:[commentsSchema],
        required:false
    },


})

module.exports = mongoose.model('Forum',forumSchema);