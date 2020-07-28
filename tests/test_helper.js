const Continent = require('../models/surfSpots/continent')
const Country = require('../models/surfSpots/country')
const Region = require('../models/surfSpots/region')
const SurfSpot = require('../models/surfSpots/surfSpot')
const User = require('../models/user')

const initialUser = {
  username: 'testuser',
  password: 'testpassword'
}

const initialSpots = [
  {
    type: 'Reef-rocky',
    direction: 'Right and left',
    bottom: 'Reef (coral, sharp rocks etc..)',
    good_swell_direction: 'NorthWest, West, SouthWest',
    good_wind_direction: 'NorthWest, West, SouthWest, SouthEast, East, NorthEast',
    best_tide_position: 'unkwnown',
    best_tide_movement: 'unkwnown',
    dangers: 'rocks',
    latitude: 'unknown',
    longitude: 'unknown',
    continent: 'Europe',
    country: 'Portugal',
    region: 'Algarve',
    name: 'praia do farol - lado poente',
  },
  {
    type: 'Beach-break',
    direction: 'Right and left',
    bottom: 'Sandy with rock',
    good_swell_direction: 'unkwnown',
    good_wind_direction: 'unkwnown',
    best_tide_position: "Don't know",
    best_tide_movement: "Don't know",
    dangers: 'rocks',
    latitude: '37.0457',
    longitude: '-8.9793',
    continent: 'Europe',
    country: 'Portugal',
    region: 'Algarve',
    name: 'Praia do Telheiro',
  },
  {
    type: 'Beach-break',
    direction: 'Right',
    bottom: 'unkwnown',
    power: 'unkwnown',
    good_swell_direction: 'NorthWest, SouthEast',
    good_wind_direction: 'North, East',
    best_tide_position: 'unkwnown',
    best_tide_movement: 'unkwnown',
    latitude: '37.0962',
    longitude: '-8.3886',
    continent: 'Europe',
    country: 'Portugal',
    region: 'Algarve',
    name: 'PRAIA NOVA',
  },
]

const continentsInDb = async () => {
  const continents = await Continent.find({})
  return continents.map(continent => continent.toJSON())
}

const nonExistingId = async () => {
  const continent = new Continent({ name: 'ti cancello' })
  await continent.save()
  await continent.remove()

  return continent._id.toString()
}

const countriesInDb = async () => {
  const countries = await Country.find({})
  return countries.map(country => country.toJSON())
}

const regionsInDb = async () => {
  const regions = await Region.find({})
  return regions.map(region => region.toJSON())
}

const surfSpotsInDb = async () => {
  const spots = await SurfSpot.find({})
  return spots.map(spot => spot.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialSpots,
  initialUser,
  nonExistingId,
  continentsInDb,
  countriesInDb,
  regionsInDb,
  surfSpotsInDb,
  usersInDb
}