const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const { InvalidUsernameError, InvalidPasswordError, InvalidEmailError } = require('../utils/customErrors')
const User = require('../models/user')

usersRouter.get('/', async (req, res) => {
  const users = await User
    .find({}).populate('blogs', { title: 1, author: 1, url: 1 })
  res.json(users.map(u => u.toJSON()))
})

usersRouter.post('/', async (req, res) => {
  const body = req.body
  const emailIsValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  if (body.password.length < 3) throw new InvalidPasswordError()
  if (!emailIsValid(body.email_address)) throw new InvalidEmailError()

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    email_address: body.email_address,
    passwordHash
  })
  const savedUser = await user.save()

  res.json(savedUser)
})

module.exports = usersRouter
