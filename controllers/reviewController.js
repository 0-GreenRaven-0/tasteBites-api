const Review = require('../models/Review')
const Recipe = require('../models/Recipe')
const User = require('../models/User')

// Description: fetch all the reviews for all exsiting recipes
// Method: GET
// Access: private

const getAllReviews = async(req, res) => {
    const reviews = await Review.find().lean()

    res.json(reviews.length? reviews : [])
}

// Description: add a review 
// Method: POST
// Access: private

const createNewReview = async(req, res) => {
    const {user, recipe, comment, rating} = req.body

    if(!user || !recipe){
        return res.status(400).json({message: 'both the user id and the recipe are required'})
    }

    const foundUser = await User.findById(user).exec()
    const foundRecipe = await Recipe.findById(recipe).exec()
    const allReviews = await Review.find({recipe}).exec()

    if(!foundUser){
        return res.status(404).json({message: 'whoever this user is does not exist'})
    }

    if(!foundRecipe){
        return res.status(404).json({message: 'the recipe does not exist'})
    }

    const review = await Review.create({ user, recipe, comment, rating})

    let totalReviews 
    let averageReview
    if(allReviews){
         totalReviews = allReviews.reduce((sum, review) => sum + review.rating, 0) + rating;
         averageReview = totalReviews / (allReviews.length + 1)
         foundRecipe.overAllRating = averageReview
         await foundRecipe.save()
    }else{
     averageReview = rating
     foundRecipe.overAllRating = averageReview
     await foundRecipe.save()
    }

    if(review){
        return res.status(200).json({message: `New review by ${foundUser.username} created! and the overall review is now ${averageReview}`})
    }else{
        return res.status(500).json({message: 'could not create the review'})
    }
}

// Description: edit an existing review 
// Method: PATCH
// Access: private

const editReview = async(req, res) => {

    const {id, comment, rating} = req.body

    if(!id){
        return res.status(400).json({message: 'please provide the id'})
    }

    const foundReview = await Review.findById(id).exec()

    if(!foundReview){
        return res.status(404).json({message: 'could not find the review'})
    }

    foundReview.comment = comment
    foundReview.rating = rating

    const updatedReview = await foundReview.save()

    const foundRecipe = await Recipe.findOne({id}).exec()
    const allReviews = await Review.find().exec()

    let totalReviews 
    let averageReview
    if(allReviews){
         totalReviews = allReviews.reduce((sum, review) => sum + review.rating, 0);
         averageReview = totalReviews / (allReviews.length)
         foundRecipe.overAllRating = averageReview
         await foundRecipe.save()
    }else{
     averageReview = rating
     foundRecipe.overAllRating = averageReview
     await foundRecipe.save()
    }

    if(!updatedReview){
        return res.status(500).json({message: 'something went wrong'})
    }else{
        return res.status(200).json({message: 'review successfully updated!'})
    }
}

// Description: delete a review 
// Method: DELETE
// Access: private

const deleteReview = async(req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'please provide the id' });
    }

    const foundReview = await Review.findById(id).exec();
    if (!foundReview) {
        return res.status(404).json({ message: 'could not find the review' });
    }

    const foundRecipe = await Recipe.findById(foundReview.recipe).exec();
    if (!foundRecipe) {
        return res.status(404).json({ message: 'Recipe not found' });
    }

    // Delete the review first
    await foundReview.deleteOne();

    // Fetch all remaining reviews for this recipe
    const recipeReviews = await Review.find({ recipe: foundRecipe._id }).exec();

    // Recalculate the overall rating
    let averageReview = 0;
    if (recipeReviews.length > 0) {
        const totalReviews = recipeReviews.reduce((sum, review) => sum + review.rating, 0);
        averageReview = totalReviews / recipeReviews.length;
    }

    // Update recipe's overall rating
    foundRecipe.overAllRating = averageReview;
    await foundRecipe.save();

    res.json({ message: "Review deleted successfully!", newAverage: averageReview });
};


module.exports = {
    getAllReviews,
    createNewReview,
    editReview,
    deleteReview
}