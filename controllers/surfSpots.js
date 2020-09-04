const {
  SurfSpotNotFoundError,
  InvalidToken,
  InvalidLatitude,
  InvalidLongitude,
  AuthenticationError,
} = require('../utils/customErrors')
const Continent = require('../models/surfSpots/continent')
const Country = require('../models/surfSpots/country')
const Region = require('../models/surfSpots/region')
const SurfSpot = require('../models/surfSpots/surfSpot')
const User = require('../models/user')
const surfRouter = require('express').Router()
const forecastHelper = require('../utils/forecastTideFetch')
const get_ip = require('ipware')().get_ip
const config = require('../utils/config')
const jwt = require('jsonwebtoken')

const latitudeIsValid = (latitude) => {
  return /^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/.test(latitude)
}

const longitudeIsValid = (longitude) => {
  return /^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$/.test(longitude)
}

surfRouter.get('/', async (req, res) => {
  const surfSpots = await Continent
    .find({}).populate({
      path: 'countries',
      select: ['name', 'latitude', 'longitude'],
      populate: {
        path: 'regions',
        select: ['name', 'latitude', 'longitude'],
        populate: {
          path: 'surfSpots',
          select: 'name',
          match: { isSecret: false },
        },
      },
    })
  const ipClient = get_ip(req).clientIp
  const response = surfSpots.concat({ ip: ipClient })
  res.json(surfSpots)
})

surfRouter.get('/surfspots', async (req, res) => {
  const spots = await SurfSpot
    .find({ isSecret: false }).select('name').populate('continent', { name: 1 }).populate('country', { name: 1 }).populate('region', { name: 1 })
  res.json(spots)
})

surfRouter.get('/continents/:id', async (req, res) => {
  const continents = await Continent
    .findById(req.params.id).populate({
      path: 'countries',
      select: 'name',
      populate: {
        path: 'regions',
        select: 'name',
        populate: {
          path: 'surfSpots',
          select: ['name', 'latitude', 'longitude'],
          match: { isSecret: false },
        },
      },
    })
  if (!continents) throw new SurfSpotNotFoundError('Continent not found')
  res.json(continents)
})

surfRouter.get('/countries/:id', async (req, res) => {
  const countries = await Country
    .findById(req.params.id).populate({
      path: 'regions',
      select: 'name',
      populate: {
        path: 'surfSpots',
        select: ['name', 'latitude', 'longitude'],
        match: { isSecret: false },
      },
    }).populate('continent', { name: 1 }).populate('country', { name: 1 })
  if (!countries) throw new SurfSpotNotFoundError('Country not found')
  res.json(countries)
})

surfRouter.get('/regions/:id', async (req, res) => {
  const regions = await Region
    .findById(req.params.id).populate('surfSpots', { name: 1, latitude: 1, longitude: 1 }, { isSecret: false })
    .populate('continent', { name: 1 }).populate('country', { name: 1 })
  if (!regions) throw new SurfSpotNotFoundError('Region not found')
  res.json(regions)
})

surfRouter.get('/surfspots/:id', async (req, res) => {
  const spot = await SurfSpot
    .findOne({ _id: req.params.id, isSecret: false }).populate('continent', { name: 1 }).populate('country', { name: 1 }).populate('region', { name: 1 }).populate('forecast', { id: 1 })
  if (!spot) throw new SurfSpotNotFoundError()
  spot.latitude !== 'unknown' && !spot.forecast && await forecastHelper.createForecast(spot)
  res.json(spot)
})

surfRouter.post('/surfspots/', async (req, res) => {
  let spot = new SurfSpot(req.body)
  const region = await Region.findById(req.body.region)
  region.surfSpots = region.surfSpots.concat(spot)
  spot = await spot.populate('continent', { name: 1 }).populate('country', { name: 1 }).populate('region', { name: 1 }).execPopulate()
  const decodedToken = jwt.verify(req.token, config .SECRET)
  if (!req.token || !decodedToken.id) throw new InvalidToken()
  if (!latitudeIsValid(req.body.latitude)) throw new InvalidLatitude()
  if (!longitudeIsValid(req.body.longitude)) throw new InvalidLongitude()
  const user = await User.findById(decodedToken.id)
  spot.user = user
  const savedSpot = await spot.save()
  
  await region.save()
  user.createdSpots = user.createdSpots.concat(savedSpot._id)
  await user.save()
  console.log(savedSpot)
  res.status(201).json(savedSpot)
})

surfRouter.put('/surfspots/:id', async (req, res) => {
  const spot = req.body
  const decodedToken = jwt.verify(req.token, config .SECRET)
  if (!req.token || !decodedToken.id) throw new InvalidToken()
  if (!latitudeIsValid(req.body.latitude)) throw new InvalidLatitude()
  if (!longitudeIsValid(req.body.longitude)) throw new InvalidLongitude()
  const user = await User.findById(decodedToken.id)
  if (spot.user !== user.id.toString()) throw new AuthenticationError('Only surfspot creator can modify it')
  const updatedSpot = await SurfSpot.findByIdAndUpdate(req.params.id, spot, { new: true })
  res.json(updatedSpot)
})

surfRouter.delete('/surfspots/:id', async (req, res) => {
  const spot = await SurfSpot.findById(req.params.id)
  const decodedToken = jwt.verify(req.token, config .SECRET)
  if (!req.token || !decodedToken.id) throw new InvalidToken()
  const user = await User.findById(decodedToken.id)
  if (spot.user.toString() !== user.id.toString()) throw new AuthenticationError('Only surfspot creator can delete it')
  await spot.remove()
  user.createdSpots = user.createdSpots.filter(spot => spot.id.toString() !== req.params.id.toString())
  await user.save()
  res.status(204).end()
})

module.exports = surfRouter
