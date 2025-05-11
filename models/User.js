const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        requried: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        requried: true
    },
    profilePicture: {
      fileId: {type: String},
      url: {type: String}
    },
    description: {
        type: String,
        default: "user haven't written anything yet..."
    },
    darkMode:{
        type: Boolean,
        default: false
    },
    favorites:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
        default: []
    }],
    resetToken: {
        type: String
    },
    resetTokenExpiry: {
        type: Date
    }
})

module.exports = mongoose.model('User', userSchema)