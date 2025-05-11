const User = require("../models/User")
const Recipe = require('../models/Recipe')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const imagekit = require('../config/imagekit')
const RecipeImage = require('../models/RecipeImage')
const UserImage = require('../models/UserImage')
const Review = require('../models/Review')
const fs = require('fs')
const path = require('path')

// Description: fetch all available users
// Method: GET
// Access: private

const getAllUsers = async (req, res) => {
    const users = await User.find().select('-password').lean()

    if(!users?.length){
        return res.status(404).json({message: 'No users were found'})
    }

    res.json(users)
}

// Description: create a new user
// Method: POST
// Access: private

const createNewUser = async(req, res) => {
    const {username, email, password, description} = req.body

    if(!username || !email || !password){
        return res.status(400).json({message: 'All Fields are required'})
    }

    const duplicate = await User.findOne({username}).collation({ locale: 'en', strength: 2}).lean().exec()
    const usedEmail = await User.findOne({email}).lean().exec()

    if(duplicate){
        return res.status(400).json({message: 'Duplicate Username'})
    }

    if(usedEmail){
        return res.status(400).json({message: 'this email was already used'})
    }

    const hashedPWD = await bcrypt.hash(password, 10)

        const userObject = {
            username,
            email,
            "password": hashedPWD,
            description,
        }
    
        const user = await User.create(userObject)
    
        if(user){
            return res.status(201).json({message: `New user ${username} created!`})
        }else{
            res.status(400).json({ message: "Invalid User Data received"})
        }
    }


// Description: edit an existing user
// Method: PATCH
// Access: private

const editUser = async (req, res) => {
    const { id, username, description, darkMode } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check for duplicate username (case-insensitive)
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec();
    if (duplicate && duplicate._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' });
    }
    // Update the user
    user.set({
        username: username ?? user.username,
        description: description ?? user.description,
        darkMode: darkMode ?? user.darkMode
    });

    const updatedUser = await user.save();

    // Generate new tokens
    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "id": updatedUser._id,
                "username": updatedUser.username,
                "email": updatedUser.email,
                "description": updatedUser.description,
                "darkMode": updatedUser.darkMode
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { "username": updatedUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // Set the refresh token in a cookie
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Return success response
    res.status(200).json({ 
        message: `User successfully updated! ${updatedUser.username}`,
        accessToken,
        user: {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            description: updatedUser.description,
            darkMode: updatedUser.darkMode
        }
    });
};


// Description: a function for sending an email for password reset request
// Method: POST
// Access: private

const sendResetEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    const resetURL = `http://localhost:3000/reset-password?token=${token}`;


    // Read the html file
    const templatePath = path.join(__dirname,'../Public/TasteBites.html')
    let template = fs.readFileSync(templatePath, 'utf-8')

    //Replace placeholders
    template = template.replace('{{resetURL}}', resetURL)

     const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'password reset request',
        html: template
     }

     await transporter.sendMail(mailOptions)
}

// Description: send a reset password request
// Method: POST
// Access: private

const forgotPassword = async(req, res) => {
    const {email} = req.body;

    if(!email){
        return res.status(400).json({message: "please provide the email"})
    }

    const user = await User.findOne({email}).exec()

    if(!user){
        return res.status(400).json({message: "Invalid email address"})
    }

    const token = require('crypto').randomBytes(32).toString('hex')

    const tokenExpiry = Date.now() + 3600000;

    user.resetToken = token
    user.resetTokenExpiry = tokenExpiry
    await user.save();

    res.json({token})
    sendResetEmail(email, token);
}


// Description: update the password
// Method: PATCH
// Access: private

const updatePassword = async(req, res) => {
    const {token, newPassword} = req.body

    if(!token){
        return res.status(400).json({message: "No reset token was found, unable to reset the password"})
    }

    if(!newPassword){
        return res.status(400).json({message: "please provide the new password you wish to update to"})
    }

    const user = await User.findOne({resetToken: token, resetTokenExpiry: {$gt: Date.now()} }).exec()

    if(!user){
        return res.status(400).json({message: "Invalid or expired token"})
    }

    const hashedPWD = await bcrypt.hash(newPassword, 10);

    user.password = hashedPWD
    user.resetToken = undefined
    user.resetTokenExpiry = undefined

    await user.save()

    res.json({message: 'Password successfully updated'});
}

// Description: delete an existing user
// Method: DELETE   
// Access: private

const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Please provide the id of the user you wish to delete" });
        }

        const foundUser = await User.findById(id).exec();
        const foundRecipes = await Recipe.find({ user: id }).exec();
        const foundImage = await UserImage.findOne({ user: id }).exec(); // use findOne
        const foundReviews = await Review.find({ user: id }).exec();

        if(foundUser){
            await foundUser.deleteOne()
        }else{
            return res.status(404).json({message: "This user does not exist..."})
        }
        // Delete the recipes and their images
        if(foundRecipes && foundRecipes.length > 0){
             for(const recipe of foundRecipes){
                const foundRecipeImages = await RecipeImage.find({recipe: recipe.id}).exec()

                if(foundRecipeImages.length > 0){
                    await Promise.all(
                        foundRecipeImages.map(image => imagekit.deleteFile(image.fileId))
                    )

                    await RecipeImage.deleteMany({ recipe: recipe.id})

                    await imagekit.deleteFolder(`TasteBites/Recipes/${recipe.id}`)
                }
                 await recipe.deleteOne()
             }
        }

        // delete the user's reviews
        if(foundReviews.length > 0){
           await Review.deleteMany({ user: id})
        }
   
        if(foundImage){
            await imagekit.deleteFile(foundImage.fileId)
            await foundImage.deleteOne()
        }
  
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


module.exports = {
    getAllUsers,
    createNewUser,
    editUser,
    sendResetEmail,
    forgotPassword,
    updatePassword,
    deleteUser
}


