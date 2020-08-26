class ApplicationError extends Error {
  constructor(message, status) {
    super()

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name

    this.message = message || 'Something went wrong. Please try again.'

    this.status = status || 500

  }
}

class UserNotFoundError extends ApplicationError {
  constructor(message) {
    super(message || 'No User found.', 404)
  }
}

class SurfSpotNotFoundError extends ApplicationError {
  constructor(message) {
    super(message || 'No Spot found.', 404)
  }
}

class AuthenticationError extends ApplicationError {
  constructor(message) {
    super(message || 'Combination user/password incorrect.', 400)
  }
}

class InvalidEmailError extends ApplicationError {
  constructor(message) {
    super(message || 'Email address not valid.', 400)
  }
}

class InvalidUsernameError extends ApplicationError {
  constructor(message) {
    super(message || 'Username not valid.', 400)
  }
}

class InvalidPasswordError extends ApplicationError {
  constructor(message) {
    super(message || 'Password not valid.', 400)
  }
}

class InvalidApiRequest extends ApplicationError {
  constructor(message) {
    super(message || 'Invalid API request.', 400)
  }
}

class InvalidToken extends ApplicationError {
  constructor(message) {
    super(message || 'Token missing or invalid', 401)
  }
}

module.exports = {
  ApplicationError,
  UserNotFoundError,
  SurfSpotNotFoundError,
  AuthenticationError,
  InvalidEmailError,
  InvalidUsernameError,
  InvalidPasswordError,
  InvalidApiRequest,
  InvalidToken
}
