const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const { InvalidPasswordError, InvalidEmailError, InvalidUsernameError } = require('../utils/customErrors')
const User = require('../models/user')

const emailIsValid = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

usersRouter.post('/', async (req, res) => {
  const body = req.body
  if (body.username.length < 3) throw new InvalidUsernameError()
  if (body.password.length < 3) throw new InvalidPasswordError()
  if (!emailIsValid(body.email)) throw new InvalidEmailError()
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    passwordHash
  })
  const savedUser = await user.save()

  res.json(savedUser)
})

module.exports = usersRouter
