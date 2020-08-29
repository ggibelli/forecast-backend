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
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('secret', 10)
  const user = new User({ username: 'rootgiovanni', passwordHash, email: 'prova@ciao.it' })
  const passwordHash2 = await bcrypt.hash('password', 10)
  const user2 = new User({ username: 'provaprova', passwordHash: passwordHash2, email: 'prova2@ciao.it' })
  await user.save()
  await user2.save()
  const continent = new Continent({ name: 'Europe', latitude: '50.00', longitude: '-50.00' })
  const country = new Country({ name: 'Portugal', continent, latitude: '20.00', longitude: '30.00' })
  const region = new Region({ name: 'Algarve', country, continent, latitude: '12.00', longitude: '-45.00' })
  const newSpot = {
    continent: continent.id,
    country: country.id,
    region: region.id,
    latitude: '76.1234',
    longitude: '32.12',
    name: 'cool beach',
    user: user
  }
  const ownedSpot = new SurfSpot(newSpot)
  await ownedSpot.save()
  continent.countries.push(country)
  country.regions.push(region)
  const surfObjects = helper.initialSpots.map((spot) => ({ ...spot, continent, country, region }))
  const surfSpotsObjects = []
  surfObjects.map(spot => {
    const newSpot = new SurfSpot(spot)
    region.surfSpots.push(newSpot)
    surfSpotsObjects.push(newSpot)
  })
  region.surfSpots.push(ownedSpot)
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
    expect(response.body.surfSpots).toHaveLength(4)
  })

  test('a single spot is present and has forecast ID', async () => {
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

  test('only the surfspots that are not secret are shown', async () => {
    const response = await api
      .get('/api/surfspots')
      .expect(200)
    const surfspots = response.body.map(spot => spot.name)
    expect(surfspots).toContain('praia do farol - lado poente')
    expect(surfspots).toContain('Praia do Telheiro')
    expect(surfspots).toContain('PRAIA NOVA')

  })

  test('if a surfspot is secret is not shown', async () => {
    const response = await api
      .get('/api/surfspots')
      .expect(200)
    const surfspots = response.body.map(spot => spot.name)
    expect(surfspots).toContain('praia do farol - lado poente')
    expect(surfspots).not.toContain('Secret Beach')

  })
})
describe('when creating a surfspot', () => {

  test('if a surfspot does not have coordinates an appropriate error is shown', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const continent = await Continent.find({})
    const country = await Country.find({})
    const region = await Region.find({})
    const newSpot = {
      continent: continent[0].id,
      country: country[0].id,
      region: region[0].id,
      name: 'cool beach',
      user: user
    }

    const res = await api
      .post('/api/surfspots')
      .set('Authorization', `Bearer ${token}`)
      .send(newSpot)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length + 1)
    expect(res.body.error).toContain('Invalid value, latitudes range from -90 to 90')

  })

  test('the latitude must be in the valid range or error is shown', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const continent = await Continent.find({})
    const country = await Country.find({})
    const region = await Region.find({})
    const newSpot = {
      continent: continent[0].id,
      country: country[0].id,
      region: region[0].id,
      latitude: '101010',
      name: 'cool beach',
      user: user
    }

    const res = await api
      .post('/api/surfspots')
      .set('Authorization', `Bearer ${token}`)
      .send(newSpot)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length + 1)
    expect(res.body.error).toContain('Invalid value, latitudes range from -90 to 90')

  })

  test('the longitude must be in the valid range or error is shown', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const continent = await Continent.find({})
    const country = await Country.find({})
    const region = await Region.find({})
    const newSpot = {
      continent: continent[0].id,
      country: country[0].id,
      region: region[0].id,
      latitude: '76.1234',
      longitude: '1234',
      name: 'cool beach',
      user: user
    }

    const res = await api
      .post('/api/surfspots')
      .set('Authorization', `Bearer ${token}`)
      .send(newSpot)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length + 1)
    expect(res.body.error).toContain('Invalid value, longitudes range from -180 to 180')
  })

  test('the surfspots is for default public', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const continent = await Continent.find({})
    const country = await Country.find({})
    const region = await Region.find({})
    const newSpot = {
      continent: continent[0].id,
      country: country[0].id,
      region: region[0].id,
      name: 'cool beach',
      latitude: '67.00',
      longitude: '-52.00',
      user: user
    }

    await api
      .post('/api/surfspots')
      .set('Authorization', `Bearer ${token}`)
      .send(newSpot)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length + 2)

    const beach = spotsAtEnd.filter(b => b.name === 'cool beach')
    expect(beach[0].isSecret).toBe(false)
  })

  test('only verified user with token can create one', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const continent = await Continent.find({})
    const country = await Country.find({})
    const region = await Region.find({})
    const newSpot = {
      continent: continent[0].id,
      country: country[0].id,
      region: region[0].id,
      name: 'cool beach',
      latitude: '67.00',
      longitude: '-52.00',
      user: user
    }

    await api
      .post('/api/surfspots')
      .set('Authorization', `Bearer ${token}`)
      .send(newSpot)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length + 2)

    const beaches = spotsAtEnd.map(b => b.name)
    expect(beaches).toContain(
      'cool beach'
    )
  })

  test('if user has no token an appropriate error is shown', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, 'wrong')
    const continent = await Continent.find({})
    const country = await Country.find({})
    const region = await Region.find({})
    const newSpot = {
      continent: continent[0].id,
      country: country[0].id,
      region: region[0].id,
      latitude: '76.1234',
      longitude: '32.12',
      name: 'cool beach',
      user: user
    }

    const res = await api
      .post('/api/surfspots')
      .set('Authorization', `Bearer ${token}`)
      .send(newSpot)
      .expect(401)
      .expect('Content-Type', /application\/json/)
    expect(res.body.error).toContain('Token missing or invalid')
    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length + 1)

  })

  test('the surfspot can be modified by its own creator', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const spotToUpdate = await SurfSpot.findOne({ user })
    const modifiedSpot = {
      continent: spotToUpdate.continent,
      country: spotToUpdate.country,
      region: spotToUpdate.region,
      latitude: spotToUpdate.latitude,
      longitude: spotToUpdate.longitude,
      name: spotToUpdate.name,
      user: spotToUpdate.user,
      isSecret: true
    }
    await api
      .put(`/api/surfspots/${spotToUpdate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(modifiedSpot)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    const spotsAtEnd = await helper.surfSpotsInDb()
    const spotModified = spotsAtEnd.find(spot => spot.name === 'cool beach')
    expect(spotModified.isSecret).toBe(true)
  })

  test('if an user tries to modify another user surfspot an error is shown', async () => {
    const user = await User.findOne({ username: 'provaprova' })
    await bcrypt.compare('password', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)

    const spotToUpdate = await SurfSpot.findOne({ name: 'cool beach' })
    const modifiedSpot = {
      continent: spotToUpdate.continent,
      country: spotToUpdate.country,
      region: spotToUpdate.region,
      latitude: spotToUpdate.latitude,
      longitude: spotToUpdate.longitude,
      name: spotToUpdate.name,
      user: spotToUpdate.user,
      isSecret: true
    }

    const res = await api
      .put(`/api/surfspots/${spotToUpdate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(modifiedSpot)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(res.body.error).toContain('Only surfspot creator can modify it')
  })

  test('the surfspot can be deleted by its own creator', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const spotToDelete = await SurfSpot.findOne({ user })
    await api
      .delete(`/api/surfspots/${spotToDelete._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)
    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length)

    const spots = spotsAtEnd.map(s => s.name)
    expect(spots).not.toContain(spotToDelete.name)
  })

  test('if an user tries to delete another user surfspot an error is shown', async () => {
    const user = await User.findOne({ username: 'provaprova' })
    await bcrypt.compare('password', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const token = jwt.sign(userForToken, config .SECRET)
    const spotToDelete = await SurfSpot.findOne({ name: 'cool beach' })
    const res = await api
      .delete(`/api/surfspots/${spotToDelete._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
    const spotsAtEnd = await helper.surfSpotsInDb()
    expect(spotsAtEnd).toHaveLength(helper.initialSpots.length + 1)

    const spots = spotsAtEnd.map(s => s.name)
    expect(spots).toContain(spotToDelete.name)
    expect(res.body.error).toContain('Only surfspot creator can delete it')
  })
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('secret', 10)
    const surfspot = await SurfSpot.findOne({ name: 'Praia do Telheiro' })
    const user = new User({ username: 'rootgiovanni', passwordHash, email: 'prova@ciao.it', starredSpots: [surfspot._id] })
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
      .expect(401)
    expect(res.body.error).toContain('Combination user/password incorrect.')
  })

  test('a single user has starred spots and created spots', async () => {
    const userToCheck = await User.findOne({ username: 'rootgiovanni' })
    const res = await api
      .get(`/api/users/${userToCheck._id}`)
      .expect(200)
    expect(res.body.starredSpots).toBeDefined()
    expect(res.body.createdSpots).toBeDefined()
  })

  test('a surfspot can be starred by logged user', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const surfspot = await SurfSpot.findOne({ name: 'cool beach' })
    const token = jwt.sign(userForToken, config .SECRET)
    const res = await api
      .put(`/api/users/${user._id}/starred/add`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: surfspot._id })
      .expect(200)
    const starredSpots = res.body.starredSpots.map(spot => spot.name)
    expect(starredSpots).toContain('cool beach')
    expect(starredSpots).toContain('Praia do Telheiro')
  })

  test('a surfspot can be unstarred by logged in user', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const surfspot = await SurfSpot.findOne({ name: 'Praia do Telheiro' })
    const token = jwt.sign(userForToken, config .SECRET)
    const res = await api
      .put(`/api/users/${user._id}/starred/remove`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: surfspot._id })
      .expect(200)
    const starredSpots = res.body.starredSpots.map(spot => spot.name)
    expect(starredSpots).not.toContain('Praia do Telheiro')
  })

  test('a surfspot cannot be starred if user has no token', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const surfspot = await SurfSpot.findOne({ name: 'cool beach' })
    const token = jwt.sign(userForToken, 'no token')
    const res = await api
      .put(`/api/users/${user._id}/starred/add`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: surfspot._id })
      .expect(401)
    expect(res.body.error).toContain('Token missing or invalid')
  })

  test('a surfspot cannot be unstarred if user has no token', async () => {
    const user = await User.findOne({ username: 'rootgiovanni' })
    await bcrypt.compare('secret', user.passwordHash)
    const userForToken = {
      username: user.username,
      id: user._id
    }
    const surfspot = await SurfSpot.findOne({ name: 'Praia do Telheiro' })
    const token = jwt.sign(userForToken, 'no token')
    const res = await api
      .put(`/api/users/${user._id}/starred/remove`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: surfspot._id })
      .expect(401)
    expect(res.body.error).toContain('Token missing or invalid')
  })
})

afterAll(() => {
  mongoose.connection.close()
})