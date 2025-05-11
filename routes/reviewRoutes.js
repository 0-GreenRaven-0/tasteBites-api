const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
   .get(reviewController.getAllReviews)
   .post(reviewController.createNewReview)
   .patch(reviewController.editReview)
   .delete(reviewController.deleteReview)

module.exports = router