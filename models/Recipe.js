const mongoose = require('mongoose')

const recipeSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        requried: true
    },
    cuisine:{
      type: String,
      default: "general"
    },
    difficulty:{
       type: String,
       required: true
    },
    tags:{
        type: [String],
        default: []
    },
    overAllRating:{
        type: Number,
        min: 0,
        max: 5,
        default: 0
    }
},
{
    timestamps: true
})

module.exports = mongoose.model("Recipe", recipeSchema)