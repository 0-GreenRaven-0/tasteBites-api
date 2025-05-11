const express = require('express')
const router = express.Router()
const usersController = require('../controllers/userController')
const verifyJWT = require('../middleware/verifyJWT')

router.route('/update-password')
   .patch(usersController.updatePassword)

router.route('/forgot-password')
   .post(usersController.forgotPassword)

router.route('/')
  .post(usersController.createNewUser)

router.route('/')
  .get(usersController.getAllUsers)

//router.use(verifyJWT)

router.route('/')
  .patch(usersController.editUser)
  .delete(usersController.deleteUser)

module.exports = router