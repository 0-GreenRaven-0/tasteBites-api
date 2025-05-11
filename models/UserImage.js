const mongoose = require("mongoose")

const userImageSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    fileId: {
        type: String,
        required: true
    },
    url: {
        type: String,
        default: '../../Settings/default-avatar.png'
    }
})

module.exports = mongoose.model("UserImage", userImageSchema)