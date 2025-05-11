const Recipe = require("../models/Recipe")
const User = require("../models/User")
const RecipeImage = require("../models/RecipeImage")
const imagekit = require("../config/imagekit")

// Description: fetch all existing recipes
// Method: GET
// Access: private

const getAllRecipes = async(req, res) => {
    const recipes = await Recipe.find().lean()

     res.json(recipes.length ? recipes: [])
}

// Description: create new recipes
// Method: POST
// Access: private

const createNewRecipes = async (req, res) => {
    const { user, name, description, cuisine, difficulty, tags} = req.body;

    if (!user) {
        return res.status(400).json({ message: "user id required" });
    }
    if (!name) {
        return res.status(400).json({ message: "name required" });
    }
    if (!difficulty) {
        return res.status(400).json({ message: "difficulty required" });
    }

   
        const recipe = await Recipe.create({
            user,
            name,
            description,
            cuisine,
            difficulty,
            tags
        });

        if (recipe) {
            return res.status(200).json(recipe);
        } else {
            return res.status(400).json({ message: 'Something went wrong...' });
        }
       }


// Description: edit existing recipes
// Method: PATCH
// Access: private

const editRecipe = async (req, res) => {
    const { id, name, description, cuisine, difficulty, tags } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Please provide the ID of the recipe you wish to update." });
    }

    const recipe = await Recipe.findById(id).exec();
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found." });
    }

    try {

        // Update recipe details
        recipe.name = name || recipe.name;
        recipe.description = description || recipe.description;
        recipe.cuisine = cuisine || recipe.cuisine;
        recipe.difficulty = difficulty || recipe.difficulty;
        recipe.tags = tags || recipe.tags;

        const updatedRecipe = await recipe.save();

        return res.json({ message: `Recipe ${updatedRecipe.name} was updated successfully!` });

    } catch (error) {
        return res.status(500).json({ message: "Something went wrong while updating the recipe.", error: error.message });
    }
};



// Description: create new recipes
// Method: POST
// Access: private

const deleteRecipe = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "and which recipe do you wish to delete?..." });
    }

    const recipe = await Recipe.findById(id).exec();

    if (!recipe) {
        return res.status(404).json({ message: "the recipe was not found..." });
    }

    const foundImages = await RecipeImage.find({ recipe: id }).exec(); // Get all images for this recipe

    if (foundImages.length > 0) {
        try {
            await Promise.all(foundImages.map(image => imagekit.deleteFile(image.fileId))); // Delete images from ImageKit
            await RecipeImage.deleteMany({ recipe: id }); // Remove from database
            await imagekit.deleteFolder(`TasteBites/Recipes/${recipe.id}`)
        } catch (err) {
            return res.status(500).json({ message: "could not delete the images of this recipe" });
        }
    }

    await recipe.deleteOne(); // Delete the recipe

    return res.status(200).json({ message: "recipe successfully deleted!!!" });
};

// Description: add a recipe to user's favorite collection
// Method: POST
// Access: private

const addToCollection = async(req, res) => {
    const {userId, recipeId} = req.body

    if(!userId || !recipeId){
        return res.status(400).json({message: "Both the user id and the recipe id are required"})
    }

    const foundUser = await User.findById(userId).exec()

    if(!foundUser){
        return res.status(404).json({message: "This user does not exist"})
    }

    const foundRecipe = await Recipe.findById(recipeId).exec()

    if(!foundRecipe){
        return res.status(404).json({message: "This recipe does not exist"})
    }

    foundUser.favorites.push(foundRecipe.id)
    await foundUser.save()

    return res.status(200).json({message: "recipe was added to collection successfully!"})
}

// Description: remove a recipe from user's favorite collection
// Method: PATCH
// Access: private

const removeFromCollection = async(req, res) => {
    const {userId, recipeId} = req.body

    if(!userId || !recipeId){
        return res.status(400).json({message: "Both the user id and the recipe id are required"})
    }

    const foundUser = await User.findById(userId).exec()

    if(!foundUser){
        return res.status(404).json({message: "This user does not exist"})
    }

    const foundRecipe = await Recipe.findById(recipeId).exec()

    if(!foundRecipe){
        return res.status(404).json({message: "This recipe does not exist"})
    }

    const filteredCollection = foundUser.favorites.filter(recipe => recipe.toString() !== recipeId)
    foundUser.favorites = filteredCollection
    await foundUser.save()

    return res.status(200).json({message: "recipe was removed from collection successfully!"})
}

module.exports = {
    getAllRecipes,
    createNewRecipes,
    editRecipe,
    deleteRecipe,
    addToCollection,
    removeFromCollection
} 