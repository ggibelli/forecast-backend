const mongoose = require('mongoose')
const mongooseUniqueValidator = require('mongoose-unique-validator')

mongoose.set('useCreateIndex', true)

const regionSchema = new mongoose.Schema({
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
  name: {
    type: String,
    unique: true,
    minlength: 3,
    required: true,
  },
  surfSpots: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurfSpot',
    },
  ],
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
})

regionSchema.index({ 'latitude': 1, 'longitude': 1 }, { 'unique': true })

regionSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

regionSchema.plugin(mongooseUniqueValidator)
const Region = mongoose.model('Region', regionSchema)

module.exports = Region