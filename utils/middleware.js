const logger = require('./logger')

const requestLogger = (req, res, next) => {
  logger.info('Method:', req.method)
  logger.info('Path:', req.path)
  logger.info('Body:', req.body)
  logger.info('---:')
  next()
}

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, req, res, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).send({ error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return res.status(401).send({
      error: 'invalid token'
    })
  } else if (error.name === 'ApplicationError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'UserNotFoundError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'SurfSpotNotFoundError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'AuthenticationError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'InvalidEmailError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'InvalidUsernameError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'InvalidPasswordError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'VersionError') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'InvalidApiRequest') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'InvalidLatitude') {
    return res.status(error.status).send({ error: error.message })
  } else if (error.name === 'InvalidLongitude') {
    return res.status(error.status).send({ error: error.message })
  }
  next(error)
}

const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    req.token = authorization.substring(7)
  }
  next()
}


module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor
}