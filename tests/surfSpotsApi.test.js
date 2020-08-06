const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')

const config = require('../utils/config')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Continent = require('../models/surfSpots/continent')
const Country = require('../models/surfSpots/country')
const Region = require('../models/surfSpots/region')
const SurfSpot = require('../models/surfSpots/surfSpot')
const User = require('../models/user')
const Forecast = require('../models/forecast')

beforeEach(async () => {
  await Continent.deleteMany({})
  await Country.deleteMany({})
  await Region.deleteMany({})
  await SurfSpot.deleteMany({})
  await Forecast.deleteMany({})
  const continent = new Continent({ name: 'Europe' })
  const country = new Country({ name: 'Portugal', continent })
  const region = new Region({ name: 'Algarve', country, continent })
  continent.countries.push(country)
  country.regions.push(region)
  const surfObjects = helper.initialSpots.map((spot) => ({ ...spot, continent, country, region }))
  const surfSpotsObjects = []
  surfObjects.map(spot => {
    const newSpot = new SurfSpot(spot)
    region.surfSpots.push(newSpot)
    surfSpotsObjects.push(newSpot)
  })
  const promiseArray = surfSpotsObjects.map(spot => spot.save())
  await continent.save()
  await country.save()
  await region.save()
  await Promise.all(promiseArray)
})

describe('when there are surfspot saved', () => {
  test('surfspots are returned as json', async () => {
    await api
      .get('/api/')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all the surfspots are present', async () => {
    const response = await api.get('/api/')
    expect(response.body[0].countries[0].regions[0].surfSpots).toHaveLength(helper.initialSpots.length)
  })

  test('all the countries are present under the continent', async () => {
    const continents = await helper.continentsInDb()
    const response = await api.get(`/api/continents/${continents[0].id}`)
    expect(response.body.countries).toHaveLength(1)
  })

  test('all the regions are present under the country', async () => {
    const countries = await helper.countriesInDb()
    const response = await api.get(`/api/countries/${countries[0].id}`)
    expect(response.body.regions).toHaveLength(1)
  })

  test('all the surf spots are present under the region', async () => {
    const regions = await helper.regionsInDb()
    const response = await api.get(`/api/regions/${regions[0].id}`)
    expect(response.body.surfSpots).toHaveLength(3)
  })

  test('a single spot is present and has forecast ID if the spot has coordinates and has forecast', async () => {
    const surfSpot = await helper.surfSpotsInDb()
    const spotWithCoordinates = surfSpot.find(spot => spot.latitude !== 'unknown')
    const response = await api.get(`/api/surfspots/${spotWithCoordinates.id}`)
    expect(response.body.id).toBeDefined()
    expect(response.body.forecast.id).toBeDefined()
    expect(response.body.tile_url).toBeDefined()
    expect(response.body.name).toContain(spotWithCoordinates.name)
    const responseForecast = await api.get(`/api/forecast/${response.body.forecast.id}`)
    expect(responseForecast.body.forecast).toBeDefined()
    expect(responseForecast.body.tides).toBeDefined()
  }, 10000)

  test('a single spot is present and has no forecast if the spot has no coordinates', async () => {
    const surfSpot = await helper.surfSpotsInDb()
    const spotNoCoordinates = surfSpot.find(spot => spot.latitude === 'unknown')
    const response = await api.get(`/api/surfspots/${spotNoCoordinates.id}`)
    expect(response.body.id).toBeDefined()
    expect(response.body.forecast).not.toBeDefined()
    expect(response.body.tile_url).not.toBeDefined()
    expect(response.body.name).toContain(spotNoCoordinates.name)
  })

  test('if the continent does not exist an appropriate error message is displayed', async () => {
    const id = await helper.nonExistingId()
    const response = await api
      .get(`/api/continents/${id}`)
      .expect(404)
      .expect('Content-Type', /application\/json/)
    expect(response.body.error).toContain('Continent not found')
  })

  test('if the country does not exist an appropriate error message is displayed', async () => {
    const id = await helper.nonExistingId()
    const response = await api
      .get(`/api/countries/${id}`)
      .expect(404)
      .expect('Content-Type', /application\/json/)
    expect(response.body.error).toContain('Country not found')
  })

  test('if the region does not exist an appropriate error message is displayed', async () => {
    const id = await helper.nonExistingId()
    const response = await api
      .get(`/api/regions/${id}`)
      .expect(404)
      .expect('Content-Type', /application\/json/)
    expect(response.body.error).toContain('Region not found')
  })

  test('if the spot does not exist an appropriate error message is displayed', async () => {
    const id = await helper.nonExistingId()
    const response = await api
      .get(`/api/surfspots/${id}`)
      .expect(404)
      .expect('Content-Type', /application\/json/)
    expect(response.body.error).toContain('No Spot found.')
  })
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'rootgiovanni', passwordHash, email: 'prova@ciao.it' })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'ggiova',
      email: 'provaprova@ciao.it',
      firstName: 'giovanni',
      lastName: 'gibelli',
      password: 'segreta',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length + 1)
    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username exists already', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'rootgiovanni',
      email: 'provaprova@ciao.it',
      firstName: 'giovanni',
      lastName: 'gibelli',
      password: 'cazzimiei',
    }
    const res = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(res.body.error).toContain('`username` to be unique')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length)
  })

  test('creation fails with proper statuscode and message if email exists already', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: '123giovanni',
      email: 'prova@ciao.it',
      firstName: 'giovanni',
      lastName: 'gibelli',
      password: 'cazzimiei',
    }
    const res = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(res.body.error).toContain('`email` to be unique')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length)
  })

  test('creation fails with proper statuscode and message if username too short', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'gi',
      email: 'provaprova@ciao.it',
      firstName: 'giovanni',
      lastName: 'gibelli',
      password: 'secret',
    }
    const res = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(res.body.error).toContain('Username not valid.')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length)
  })

  test('creation fails with proper statuscode and message if email not valid', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'giovann',
      email: 'provaprova.ciao.it',
      firstName: 'giovanni',
      lastName: 'gibelli',
      password: 'secret',
    }
    const res = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(res.body.error).toContain('Email address not valid.')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length)
  })

  test('creation fails with proper statuscode and message if password too short', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'giovanni',
      email: 'provaprova@ciao.it',
      firstName: 'giovanni',
      lastName: 'gibelli',
      password: 'gi',
    }
    const res = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(res.body.error).toContain('Password not valid.')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length)
  })

  test('login successfull with right credentials', async () => {
    const res = await api
      .post('/api/login')
      .send({ email: 'prova@ciao.it', password: 'secret' })
      .expect(200)
    expect(res.body.token).toBeDefined()
  })

  test('login fails with wrong credentials', async () => {
    const res = await api
      .post('/api/login')
      .send({ email: 'prova@ciao.it', password: 'wrong' })
      .expect(400)
    expect(res.body.error).toContain('Combination user/password incorrect.')
  })
})

afterAll(() => {
  mongoose.connection.close()
})