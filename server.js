require('dotenv').config()
const express = require("express")
const app = express()
const PORT = process.env.PORT || 3500
const path = require("path")
const cors = require('cors');
const corsOptions = require("./config/corsOptions")
const connectDB = require("./config/dbConnect");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser')

connectDB()

app.use(express.json())

app.use(cors(corsOptions))

app.use(cookieParser())

app.use("/", express.static(path.join(__dirname,"Public")))

app.use('/', require('./routes/root'))
app.use('/auth',require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/recipe', require('./routes/recipeRoutes'))
app.use('/review', require('./routes/reviewRoutes'))
app.use('/userImage', require('./routes/userImageRoutes'))
app.use('/recipeImage', require('./routes/recipeImageRoutes'))

app.all('*', (req, res) => {
    res.status(404)
    if(req.accepts('html')){
        res.sendFile(path.join(__dirname, "views","404.html"))
    }else if(req.accepts('json')){
        res.json({message: 'Not found'})
    }else{
        res.type('txt').send("Not found!")
    }
})

mongoose.connection.once('open', () => {
    console.log('connected to database successfully! :D')
    app.listen(PORT, () => {
        console.log(`server running on port ${PORT}`)
    })
})

mongoose.connection.on('error', err => {
   console.log(err)
   console.log('whatever has happened fix it now...')
})

