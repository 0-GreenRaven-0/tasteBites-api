const User = require('../models/User')
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')

// Description: user login
// Method: POST
// Access: private

const login = async(req, res) => {
    const {username, email, password} = req.body

    if(!username || !email || !password){
        res.status(400).json({message: "All fields are requried"})
    }

    const foundUser = await User.findOne({username}).exec()

    if(!foundUser){
        return res.status(404).json({message: "such user does not exist"})
    }

    if(foundUser.email !== email){
        return res.status(400).json({message: "invalid email"})
    }

    const match = await bcrypt.compare(password, foundUser.password)

    if(!match){
        return res.status(400).json({message: "incorrect password"})
    }


    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "id": foundUser._id,
                "username": foundUser.username,
                "email": foundUser.email,
                "description": foundUser.description,
                "darkMode": foundUser.darkMode
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m'}
    )

    const refreshToken = jwt.sign(
        {"username": foundUser.username},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d'}
    )

    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({ accessToken })
}

// Description: refresh user's access token
// Method: GET
// Access: private

const refresh = (req, res) => {
    const cookies = req.cookies

    if(!cookies?.jwt){
        return res.status(401).json({message: "Unauthorized"})
    }

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if(err){
                return res.status(403).json({message: "Forbiden"})
            }

            const foundUser = await User.findOne({username: decoded.username}).exec()

            if(!foundUser){
                return res.status(401).json({message: "Unauthorized"})
            }

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "id": foundUser._id,
                        "username": foundUser.username,
                        "email": foundUser.email,
                        "profilePicture": foundUser.profilePicture,
                        "description": foundUser.description,
                        "darkMode": foundUser.darkMode
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m'}
            )

            res.json({accessToken})
        }
    )
}

// Description: log the user out and clear his credentials
// Method: POST
// Access: private

const logout = async (req, res) => {
    const cookies = req.cookies
    
    if(!cookies?.jwt){
        return res.sendStatus(204)
    }

    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'None',
        secure: true
    })

    res.json({message: 'Cookie Cleared'})
}

module.exports = {
    login,
    refresh,
    logout
}