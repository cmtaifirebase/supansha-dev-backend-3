// schema for individual user

const mongoose = require('mongoose');



const individualSchema = new mongoose.Schema({

    // user details
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
        required: true,
        enum: ['individual', 'organization'],
    },
    subCategory: {
        type: String,
        required: true,
        enum: ['development-doers', 'development-dealers', 'development-drivers', 'development-donors'],
    },
})

module.exports = mongoose.model('Individual', individualSchema);    