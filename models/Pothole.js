const mongoose = require("mongoose");

const potholeSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true,
        minlength: 5
    },
    longitude: {
        type: String,
        required: true,
        minlength: 5,
        unique: true
    },
    latitude: {
        type: String,
        required: true,
        minlength: 5,
        unique: true
    },
    level: {
        type: String,
        required: true,
        minlength: 1,
    },
    contributor: {
        type:String,
        default: ""
    }
}, {timestamps:true}
);

module.exports = mongoose.model("Pothole", potholeSchema);