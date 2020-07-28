const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const config = require('../utils/config')
const { AuthenticationError } = require('../utils/customErrors')
const loginRouter = require('express').Router()

loginRouter.post('/', async (req, res) => {
  const body = req.body
  const user = await User.findOne({ username: body.username })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(body.password, user.passwordHash)
  if (!(user && passwordCorrect)) throw new AuthenticationError()

  const userForToken = {
    username: user.username,
    id: user._id
  }

  const token = jwt.sign(userForToken, config .SECRET)

  res
    .status(200)
    .send({ token, username: user.username, name: user.name, email_address: user.email_address })
})

module.exports = loginRouter