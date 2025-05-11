const mongoose = require("mongoose")

const recipeImageSchema = mongoose.Schema({
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Recipe'
    },
    fileId: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("RecipeImage", recipeImageSchema)