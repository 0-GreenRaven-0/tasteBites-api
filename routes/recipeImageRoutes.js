const express = require("express")
const router = express.Router()
const recipeImageController = require('../controllers/recipeImageController')
const upload = require('../config/multerConfig')
const verifyJWT = require('../middleware/verifyJWT')

router.route('/').get(recipeImageController.getRecipeImage)

router.use(verifyJWT)

router.route('/')
    .post(upload.array("images", 5), recipeImageController.uploadRecipeImages)
    .delete(recipeImageController.deleteRecipeImages)

module.exports = router