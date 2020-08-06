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
})

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