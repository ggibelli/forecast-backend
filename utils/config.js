require('dotenv').config()

const PORT = process.env.PORT
let MONGODB_URI = process.env.MONGODB_URI
const SECRET = process.env.SECRET
const STORMGLASS_API = process.env.API_STORMGLASS
const TOMTOM_API = process.env.API_TOMTOM
const WEATHER_API = process.env.API_WEATHER

if (process.env.NODE_ENV === 'test') {
  MONGODB_URI = process.env.TEST_MONGODB_URI
}

module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  STORMGLASS_API,
  TOMTOM_API,
  WEATHER_API
}