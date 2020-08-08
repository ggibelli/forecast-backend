const { SurfSpotNotFoundError } = require('../utils/customErrors')
const Continent = require('../models/surfSpots/continent')
const Country = require('../models/surfSpots/country')
const Region = require('../models/surfSpots/region')
const SurfSpot = require('../models/surfSpots/surfSpot')
const surfRouter = require('express').Router()
const forecastHelper = require('../utils/forecastTideFetch')

surfRouter.get('/', async (req, res) => {
  const surfSpots = await Continent
    .find({}).populate({
      path: 'countries',
      select: ['name', 'latitude', 'longitude'],
      populate: {
        path: 'regions',
        select: 'name',
        populate: {
          path: 'surfSpots',
          select: 'name',
        },
      },
    })
  res.json(surfSpots)
})

surfRouter.get('/surfspots', async (req, res) => {
  const spots = await SurfSpot
    .find({}).select('name').populate('continent', { name: 1 }).populate('country', { name: 1 }).populate('region', { name: 1 })
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
          select: 'name',
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
      populate: { path: 'surfSpots', select: 'name' },
    }).populate('continent', { name: 1 }).populate('country', { name: 1 })
  if (!countries) throw new SurfSpotNotFoundError('Country not found')
  res.json(countries)
})

surfRouter.get('/regions/:id', async (req, res) => {
  const regions = await Region
    .findById(req.params.id).populate('surfSpots', { name: 1 })
  if (!regions) throw new SurfSpotNotFoundError('Region not found')
  res.json(regions)
})

surfRouter.get('/surfspots/:id', async (req, res) => {
  const spot = await SurfSpot
    .findById(req.params.id).populate('continent', { name: 1 }).populate('country', { name: 1 }).populate('region', { name: 1 }).populate('forecast', { id: 1 })
  if (!spot) throw new SurfSpotNotFoundError()
  spot.latitude !== 'unknown' && !spot.forecast && await forecastHelper.createForecast(spot)
  //spot.forecast && forecastHelper.fetchForecast(spot)
  res.json(spot)
})

module.exports = surfRouter
