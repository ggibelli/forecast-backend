const fs = require('fs').promises
const logger = require('./utils/logger')
const Continent = require('./models/surfSpots/continent')
const Country = require('./models/surfSpots/country')
const Region = require('./models/surfSpots/region')
const SurfSpot = require('./models/surfSpots/surfSpot')

require('./index')

const createContinent = async (name) => {
  const continent = { name }
  const newContinent = new Continent(continent)
  try {
    await newContinent.save()
    return newContinent
  } catch (error) {
    logger.error(error)
    const existingContinent = await Continent.findOne({ name })
    return existingContinent
  }
}

const createCountry = async (name, continent) => {
  const country = { name, continent }
  const newCountry = new Country(country)
  try {
    await newCountry.save()
    continent.countries.push(newCountry)
    await continent.save()
    return newCountry
  } catch (error) {
    logger.error(error)
    const existingCountry = await Country.findOne({ name })
    return existingCountry
  }
}

const createRegion = async (name, continent, country) => {
  const region = { name, continent, country }
  const newRegion = new Region(region)
  country.regions.push(newRegion)
  try {
    await newRegion.save()
    await country.save()
    return newRegion
  } catch (error) {
    logger.error(error)
    const existingRegion = Region.findOne({ name })
    return existingRegion
  }
}

const createSpot = async (spot, continent, country, region) => {
  const surfSpot = {
    name: spot.spot,
    continent,
    country,
    region,
    type: spot.type,
    direction: spot.direction,
    bottom: spot.bottom,
    good_swell_direction: spot.good_swell_direction,
    good_wind_direction: spot.good_wind_direction,
    best_tide_position: spot.best_tide_position,
    best_tide_movement: spot.best_tide_movement,
    dangers: spot.dangers,
    latitude: spot.latitude,
    longitude: spot.longitude,
  }
  const newSpot = new SurfSpot(surfSpot)
  region.surfSpots.push(newSpot)
  try {
    await region.save()
    await newSpot.save()
  } catch (error) {
    logger.error(error)
  }
}

const createSurfSpot = async (spot) => {
  let continent
  let country
  let region
  try {
    continent = await createContinent(spot.continent)
  } catch(e) {
    continent = await Continent.findOne({ name: spot.continent })
  }
  try {
    country = await createCountry(spot.country, continent)
  } catch(e) {
    country = await Country.findOne({ name: spot.country })
  }
  try {
    region = await createRegion(spot.region, continent, country)
  } catch(e) {
    region = await Region.findOne({ name: spot.region })
  }
  if (continent && country && region) await createSpot(spot, continent, country, region)
}

const seedDatabaseLocations = async () => {
  const rawData = await fs.readFile('./cleanSpotsPt.json')
  const surfSpots = JSON.parse(rawData)
  surfSpots.map((surfspot) => createSurfSpot(surfspot))
}

seedDatabaseLocations()
