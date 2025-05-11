const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowsMs: 60 * 1000,
  max: 5,
  message: "too many login attempts, please try again after a minute",
  handler: (req,res,next,options) => {
    res.status(options.statusCode).send(options.message)
  },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = loginLimiter