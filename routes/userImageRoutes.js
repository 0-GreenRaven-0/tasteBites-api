const express = require("express")
const router = express.Router()
const userImageController = require("../controllers/userImageController")
const upload = require("../config/multerConfig")
const verifyJWT = require("../middleware/verifyJWT")

//router.use(verifyJWT)

router.route('/')
   .get(userImageController.getUserImage)
   .post(upload.single("image"), userImageController.uploadUserImage)
   .patch(upload.single("newPic"), userImageController.editUserImage)
   .delete(userImageController.deleteUserImage)

module.exports = router