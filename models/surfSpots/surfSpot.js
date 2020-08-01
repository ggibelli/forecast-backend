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
  forecast: [mongoose.Schema.Types.Mixed],
  forecast_last_request: Number,
  tides: [mongoose.Schema.Types.Mixed],
  tides_last_request: Number,
  tile_url: String,
})

spotSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.forecast_last_request
    delete returnedObject.tides_last_request
  },
})

const SurfSpot = mongoose.model('SurfSpot', spotSchema)

module.exports = SurfSpot