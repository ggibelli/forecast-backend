const axios =  require('axios')
const config = require('./config')
const Forecast = require('../models/forecast')
const { InvalidApiRequest } = require('../utils/customErrors')


const surfParams = [
  'secondarySwellDirection', 'secondarySwellHeight', 'secondarySwellPeriod',
  'windWaveDirection', 'windWaveHeight', 'windWavePeriod',
  'swellDirection', 'swellHeight', 'swellPeriod',
  'waveDirection', 'waveHeight', 'wavePeriod',
  'windDirection', 'windSpeed', 'gust',
  'waterTemperature', 'airTemperature', 'cloudCover', 'precipitation'
].join(',')

const reducer = (accumulator, currentValue) => accumulator + currentValue

const createForecast = async (spot) => {
  const forecast = new Forecast({ surfspot: spot })
  await forecast.save()
  spot.forecast = await Forecast.findOne({ surfspot: spot })
  spot.tile_url = `https://api.maptiler.com/maps/062c0d04-1842-4a45-8181-c5bec3bf2214/static/${spot.longitude},${spot.latitude},12/260x260.png?key=3tFgnOQBQixe61aigsBT&attribution=0`
  await spot.save()
}

const fetchForecast = async (spot, forecastPassed) => {
  const forecast = !forecastPassed ? await Forecast.findOne({ surfspot: spot }) : forecastPassed
  const timeForecastRequest = Math.floor(Date.now() / 1000)
  // If the request if within 6 hours from the last one I provide the same forecast data
  if ((timeForecastRequest - forecast.forecastLastRequest) > 21600 || !forecast.forecastLastRequest) {
    const timeEndForecast = timeForecastRequest + 432001 // 5 days
    try {
      const forecastData = await axios.get(`https://api.stormglass.io/v2/weather/point?lat=${spot.latitude}&lng=${spot.longitude}&end=${timeEndForecast}&params=${surfParams}`, {
        headers: {
          'Authorization': config.STORMGLASS_API
        }
      })
      const arrayWaves = forecastData.data.hours.map(hour => {
        // First convert the objects to array
        const objects = Object.entries(hour)
        const newArray = objects.map(object => {
          // Check that the value is a object, then convert it to array
          const valuesArray = typeof object[1] === 'object' && Object.values(object[1])
          // Check that the returned array is not undefined, then calculate the avg of the data and return the object
          return valuesArray && { [object[0]]: valuesArray.reduce(reducer) / valuesArray.length }
        })
        // return the avg data for each hour
        return { time: hour.time, data: newArray.filter(element => element !== false) }
      })

      // Filter the array to show only 6 times of the day (es: 00.00, 04.00, 08.00, 12.00 etc)
      forecast.forecast = arrayWaves.slice(0, 121).filter((el, index) => index % 4 === 0)
      forecast.forecastLastRequest = timeForecastRequest
    } catch(error) {
      throw new InvalidApiRequest()
    }
  }

  // If the request is older than 5 days from the last one or if there is no tides data present I make a new request
  if ((timeForecastRequest - forecast.tidesLastRequest) > 432000 || !forecast.tidesLastRequest) {
    try {
      const tideData = await axios.get(`https://api.stormglass.io/v2/tide/extremes/point?lat=${spot.latitude}&lng=${spot.longitude}`, {
        headers: {
          'Authorization': config.STORMGLASS_API
        }
      })
      forecast.tides = tideData.data.data
      forecast.tidesLastRequest = timeForecastRequest
    } catch(error) {
      throw new InvalidApiRequest()
    }
  }
  await forecast.save()
}

module.exports = { fetchForecast, createForecast }