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
  latitude: String,
  longitude: String,
})

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
