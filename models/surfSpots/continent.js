const mongoose = require('mongoose')
const mongooseUniqueValidator = require('mongoose-unique-validator')

mongoose.set('useCreateIndex', true)

const continentSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    minlength: 3,
    required: true,
  },
  countries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
    },
  ],
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
})

continentSchema.index({ 'latitude': 1, 'longitude': 1 }, { 'unique': true })

continentSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

continentSchema.plugin(mongooseUniqueValidator)
const Continent = mongoose.model('Continent', continentSchema)

module.exports = Continent
