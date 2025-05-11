const express = require('express')
const router = express.Router()
const recipeController = require('../controllers/recipeController')
const verifyJWT = require('../middleware/verifyJWT')

router.route('/')
   .get(recipeController.getAllRecipes)

router.use(verifyJWT)

router.route('/')
  .post(recipeController.createNewRecipes)
  .patch(recipeController.editRecipe)
  .delete(recipeController.deleteRecipe)

router.route('/collection')
 .post(recipeController.addToCollection)
 .patch(recipeController.removeFromCollection)

module.exports = router