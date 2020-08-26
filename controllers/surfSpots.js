const { SurfSpotNotFoundError, InvalidToken } = require('../utils/customErrors')
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
  const spot = new SurfSpot(req.body)
  const region = await Region.findById(req.body.region)
  region.surfSpots = region.surfSpots.concat(spot)
  const decodedToken = jwt.verify(req.token, config .SECRET)
  if (!req.token || !decodedToken.id) throw new InvalidToken()
  const user = await User.findById(decodedToken.id)
  spot.user = user
  const savedSpot = await spot.save()
  await region.save()
  user.createdSpots = user.createdSpots.concat(savedSpot._id)
  res.json(savedSpot)
})

// aggiungo rimuovi spot aggiunti da utente, e visualizzazione spot privati

module.exports = surfRouter
