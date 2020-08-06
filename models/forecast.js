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
  forecastLastRequest: Number,
  tides: [mongoose.Schema.Types.Mixed],
  tidesLastRequest: Number,
})

forecastSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.forecastLastRequest
    delete returnedObject.tidesLastRequest
  },
})

forecastSchema.plugin(mongooseUniqueValidator)
const Forecast = mongoose.model('Forecast', forecastSchema)

module.exports = Forecast