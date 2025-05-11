const UserImage = require('../models/UserImage')
const User = require('../models/User')
const imagekit = require('../config/imagekit')

// Description: fetch a specific user's profile image
// Method: GET
// Access: private

const getUserImage = async(req, res) => {
 const profileImages = await UserImage.find().lean()

 if(!profileImages?.length){
    return res.status(200).json([]);
 }

 res.json(profileImages)
}

// Description: upload a profile picture for a user
// Method: POST
// Access: private

const uploadUserImage = async(req, res) => {
    const {user} = req.body
    const image = req.file

    if(!user){
        return res.status(400).json({message: "user id is required"})
    }

    if(!image){
        return res.status(400).json({message: "no image was provided"})
    }

    const foundUser = await User.findById(user).exec()

    if(!foundUser){
        return res.status(404).json({message: "This user does not exist"})
    }

    const fileBuffer = image.buffer.toString("base64");

    const response = await imagekit.upload({
        file: fileBuffer,
        fileName: `${foundUser.username}'s profile image`,
        folder: "TasteBites/profilePics"
    })

    let profileImage 
    if(response){
        const imageObject = {
            user,
            fileId: response.fileId,
            url: response.url
        }

        profileImage = await UserImage.create(imageObject)
    }else{
        return res.status(500).json({message: "an error has occured while uploading the image"})
    }

    if(profileImage){
        return res.status(200).json({message: `upload success!`})
    }else{
        return res.status(500).json({message: 'upload and creation were not successfull...'})
    }
}

// Description: edit the user's profile image
// Method: PATCH
// Access: private

const editUserImage = async (req, res) => {
    const { user, oldPic } = req.body;
    const newPic = req.file; 

    if (!user) {
        return res.status(400).json({ message: "User id is required!" });
    }

    const foundUser = await User.findById(user).lean();
    if (!foundUser) {
        return res.status(400).json({ message: "This user does not exist" });
    }

    if (!oldPic || !newPic) {
        return res.status(400).json({ message: "Both images are required" });
    }

    const foundPic = await UserImage.findById(oldPic);
    if (!foundPic) {
        return res.status(400).json({ message: "Could not find the old image" });
    }

    try {
        await imagekit.deleteFile(foundPic.fileId);
    } catch (err) {
        return res.status(500).json({ message: "Could not delete the image during the edit process" });
    }

    const fileBuffer = newPic.buffer.toString("base64");
    const response = await imagekit.upload({
        file: fileBuffer,
        fileName: `${foundUser.username}'s profile image`,
        folder: "TasteBites/profilePics"
    });

    if (!response) {
        return res.status(500).json({ message: "Could not upload the new image" });
    }

    // Update existing image record
    foundPic.fileId = response.fileId;
    foundPic.url = response.url;
    await foundPic.save();

    res.status(200).json({ message: "User's profile image was successfully updated!" });
};

// Description: delete an image
// Method: DELETE
// Access: private

const deleteUserImage = async (req, res) => {
    const {id} = req.body

    if(!id){
        return res.status(400).json({message: 'image id is required'})
    }

    const foundImage = await UserImage.findById(id).exec()

    if(!foundImage){
        return res.status(404).json({message: "This profile image could not be found..."})
    }

    try {
        await imagekit.deleteFile(foundImage.fileId);
        await foundImage.deleteOne()
    } catch (err) {
        return res.status(500).json({ message: "Could not delete the image during the edit process" });
    }

    return res.status(200).json({message: "all done and deleted!"})
}

module.exports = {
    getUserImage,
    uploadUserImage,
    editUserImage,
    deleteUserImage
}