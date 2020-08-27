const mongoose = require('mongoose')
const mongooseUniqueValidator = require('mongoose-unique-validator')

mongoose.set('useCreateIndex', true)

const countrySchema = new mongoose.Schema({
  continent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Continent',
    required: true,
  },
  name: {
    type: String,
    unique: true,
    minlength: 3,
    required: true,
  },
  regions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
    },
  ],
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
})

countrySchema.index({ 'latitude': 1, 'longitude': 1 }, { 'unique': true })

countrySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

countrySchema.plugin(mongooseUniqueValidator)
const Country = mongoose.model('Country', countrySchema)

module.exports = Country
