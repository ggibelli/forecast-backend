const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const { InvalidPasswordError } = require('../utils/customErrors')
const User = require('../models/user')

usersRouter.post('/', async (req, res) => {
  const body = req.body
  if (body.password.length < 3) throw new InvalidPasswordError()

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    passwordHash
  })
  const savedUser = await user.save()

  res.json(savedUser)
})

module.exports = usersRouter
