const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const { InvalidPasswordError, InvalidEmailError, InvalidUsernameError, InvalidToken } = require('../utils/customErrors')
const User = require('../models/user')
const config = require('../utils/config')
const jwt = require('jsonwebtoken')

const emailIsValid = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

usersRouter.get('/', async (req, res) => {
  const users = await User
    .find({})
  res.json(users.map(u => u.toJSON()))
})

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

usersRouter.get('/:id', async (req, res) => {
  const user = await User
    .findById(req.params.id).populate({
      path: 'StarredSpots',
      select: 'name',
      populate: {
        path: 'CreatedSpots',
        select: 'name',
      },
    })
  res.json(user)
})

usersRouter.put('/:id/starred/add', async (req, res) => {
  const { id } = req.body
  const decodedToken = jwt.verify(req.token, config .SECRET)
  if (!req.token || !decodedToken.id) throw new InvalidToken()
  const updatedUser = await User.findByIdAndUpdate(req.params.id, { $addToSet: { starredSpots: id } },
    { new: true }).populate('StarredSpots', { name: 1 })
  res.json(updatedUser)
})

usersRouter.put('/:id/starred/remove', async (req, res) => {
  const { id } = req.body
  const decodedToken = jwt.verify(req.token, config .SECRET)
  if (!req.token || !decodedToken.id) throw new InvalidToken()
  const updatedUser = await User.findByIdAndUpdate(req.params.id, { $pull: { starredSpots: id } },
    { new: true }).populate('StarredSpots', { name: 1 })
  res.json(updatedUser)
})

module.exports = usersRouter
