const mongoose = require('mongoose')
const mongooseUniqueValidator = require('mongoose-unique-validator')
require('mongoose-unique-validator')

mongoose.set('useCreateIndex', true)

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    minlength: 3,
    required: true,
  },
  firstName: String,
  lastName: String,
  passwordHash: String,
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

userSchema.plugin(mongooseUniqueValidator)
const User = mongoose.model('User', userSchema)

module.exports = User