const ImageKit = require("imagekit")
require("dotenv").config

const imagekit = new ImageKit({
    publicKey: process.env.PUBLICKEY,
    privateKey: process.env.PRIVATEKEY,
    urlEndpoint: process.env.URLENDPOINT,
})

module.exports = imagekit