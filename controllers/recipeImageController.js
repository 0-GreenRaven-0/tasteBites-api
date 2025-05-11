const Recipe = require('../models/Recipe')
const RecipeImage = require('../models/RecipeImage')
const imagekit = require('../config/imagekit')
const {randomUUID} = require('crypto')

// Description: fetch a specific recipe's images 
// Method: GET
// Access: private

const getRecipeImage = async (req, res) => {
    const recipeImages = await RecipeImage.find().lean()

    if(!recipeImages?.length){
        return res.status(200).json([])
    }

    res.json(recipeImages)
}

// Description: upload new images for a recipe
// Method: POST
// Access: private

const uploadRecipeImages = async(req, res) => {
   const {recipe} = req.body
   const images = req.files 

   if(!recipe){
    return res.status(400).json({message: "recipe id is required"})
   }

   const foundRecipe = await Recipe.findById(recipe).exec()

   if(!foundRecipe){
    return res.status(404).json({message: "this recipe does not exist"})
   }

   if(!images || images.length === 0){
    return res.status(400).json({message: "No images were provided"})
   }

   try{
     const uploadResults = await Promise.all(
        images.map( async (image) => {
            const fileBuffer = image.buffer.toString("base64")

            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: `${foundRecipe.name}'s image ${randomUUID}`,
                folder: `TasteBites/Recipes/${recipe}`
            })

            return {
                recipe,
                fileId: response.fileId,
                url: response.url
            }
        })
     )

     await RecipeImage.insertMany(uploadResults)

     return res.status(200).json({message: "Images were successfully !"})
   }catch(err){
    return res.status(500).json({message: "an error has occured while uploading the images..."})
   }
}

// Description: delete some of the images that belongs to a specifc recipe
// Method: DELETE
// Access: private

const deleteRecipeImages = async(req, res) => {
    const {recipe, oldPics} = req.body

    if(!recipe){
        return res.status(400).json({messae: "recipe id is required"})
    }

    const foundRecipe = await Recipe.findById(recipe).exec()

    if(!foundRecipe){
        return res.status(404).json({message: "this recipe does not exist :("})
    }

    if(oldPics && oldPics.length > 0){

        try{
             await Promise.all(
                oldPics.map( async (pic) => {
                    const foundImage = await RecipeImage.findById(pic).exec()
                    if(!foundImage) return

                    await imagekit.deleteFile(foundImage.fileId)
                    await foundImage.deleteOne()
                    
                })
            )
        }catch(err){
            return res.status(500).json({ message: "An error occurred while deleting the images" });
        }
    }

    return res.status(200).json({message: "the images were successfully deleted!"})
}

module.exports = {
    getRecipeImage,
    uploadRecipeImages,
    deleteRecipeImages
}