const mongoose = require('mongoose');
const mongooseUniqueValidator = require('mongoose-unique-validator');

mongoose.set('useCreateIndex', true);

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
  forecast: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forecast',
  },
  type: String,
  direction: String,
  bottom: String,
  good_swell_direction: String,
  good_wind_direction: String,
  best_tide_position: String,
  best_tide_movement: String,
  dangers: String,
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
  tile_url: String,
  isSecret: { type: Boolean, default: false },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

spotSchema.index({ latitude: 1, longitude: 1 }, { unique: true });

spotSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

spotSchema.plugin(mongooseUniqueValidator);
const SurfSpot = mongoose.model('SurfSpot', spotSchema);

module.exports = SurfSpot;
