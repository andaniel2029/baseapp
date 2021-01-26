const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error')
const groups = require('./routes/groupRoutes')
const games = require('./routes/gameRoutes')
const auth = require('./routes/auth')
const cookieParser = require('cookie-parser')
const fileupload = require('express-fileupload')

dotenv.config({ path: './config/config.env' })

connectDB()

const app = express()

app.use(express.json())

app.use(cookieParser())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(fileupload())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/v1/groups', groups)
app.use('/api/v1/games', games)
app.use('/api/v1/auth', auth)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
)

process.on('unhandledRejection', (error, promise) => {
  console.log(`Error: ${error.message}`)
  server.close(() => process.exit(1))
})
