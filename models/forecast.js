const mongoose = require('mongoose')
const mongooseUniqueValidator = require('mongoose-unique-validator')

mongoose.set('useCreateIndex', true)

const forecastSchema = new mongoose.Schema({
  surfspot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SurfSpot',
    required: true,
    unique: true,
  },
  forecast: [mongoose.Schema.Types.Mixed],
  forecast_last_request: Number,
  tides: [mongoose.Schema.Types.Mixed],
  tides_last_request: Number,
})

forecastSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.forecast_last_request
    delete returnedObject.tides_last_request
  },
})

forecastSchema.plugin(mongooseUniqueValidator)
const Forecast = mongoose.model('Forecast', forecastSchema)

module.exports = Forecast