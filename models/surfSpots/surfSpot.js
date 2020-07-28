const mongoose = require('mongoose')

mongoose.set('useCreateIndex', true)

const spotSchema = new mongoose.Schema({
  continent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Continent',
    required: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true,
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true,
  },
  name: {
    type: String,
    minlength: 2,
    required: true,
  },
  type: String,
  direction: String,
  bottom: String,
  good_swell_direction: String,
  good_wind_direction: String,
  best_tide_position: String,
  best_tide_movement: String,
  dangers: String,
  latitude: String,
  longitude: String,
})

spotSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

const SurfSpot = mongoose.model('SurfSpot', spotSchema)

module.exports = SurfSpot