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

beforeEach(async () => {
  await Continent.deleteMany({})
  await Country.deleteMany({})
  await Region.deleteMany({})
  await SurfSpot.deleteMany({})

  const continent = new Continent({ name: 'Europe' })
  const country = new Country({ name: 'Portugal', continent })
  const region = new Region({ name: 'Algarve', country, continent })
  continent.countries.push(country)
  country.regions.push(region)
  const surfObjects = helper.initialSpots.map((spot) => ({ ...spot, continent, country, region }))
  const surfSpotsObjects = []
  surfObjects.map(spot => {
    const newSpot = new SurfSpot(spot)
    region.surf_spots.push(newSpot)
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
    expect(response.body[0].countries[0].regions[0].surf_spots).toHaveLength(helper.initialSpots.length)
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
    expect(response.body.surf_spots).toHaveLength(3)
  })

  test('a single spot is present', async () => {
    const surfSpot = await helper.surfSpotsInDb()
    const response = await api.get(`/api/surfspots/${surfSpot[0].id}`)
    expect(response.body.id).toBeDefined()
    expect(response.body.name).toContain(surfSpot[0].name)
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
    const user = new User({ username: 'rootgiovanni', passwordHash, email_address: 'prova@ciao.it' })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'ggiova',
      name: 'gio gibe',
      password: 'segreta',
      email_address: 'gio@vanni.com'
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
      name: 'gio gibe',
      password: 'cazzimiei',
      email_address: 'gio@vanni.com'
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

  test('creation fails with proper statuscode and message if username too short', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'gi',
      name: 'gio gibe',
      password: 'secret',
      email_address: 'gio@vanni.com'
    }
    const res = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    expect(res.body.error).toContain('User validation failed')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length)
  })

  test('creation fails with proper statuscode and message if password too short', async () => {
    const userAtStart = await helper.usersInDb()
    const newUser = {
      username: 'giovanni',
      name: 'gio gibe',
      password: 'gi',
      email_address: 'gio@vanni.com'
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
      .send({ username: 'rootgiovanni', password: 'secret' })
      .expect(200)
    expect(res.body.token).toBeDefined()
  })

  test('login fails with wrong credentials', async () => {
    const res = await api
      .post('/api/login')
      .send({ username: 'rootgiovanni', password: 'wrong' })
      .expect(400)
    expect(res.body.error).toContain('Combination user/password incorrect.')
  })
})

afterAll(() => {
  mongoose.connection.close()
})