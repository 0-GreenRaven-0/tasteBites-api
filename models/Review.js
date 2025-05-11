const mongoose = require('mongoose')

const reviewSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    recipe:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Recipe'
    },
    rating:{
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    comment:{
       type: String,
    }
},
{
  timestamps: true
})

module.exports = mongoose.model('Review', reviewSchema)