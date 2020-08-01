const axios =  require('axios')
const config = require('./config')

const surfParams = [
  'secondarySwellDirection', 'secondarySwellHeight', 'secondarySwellPeriod',
  'windWaveDirection', 'windWaveHeight', 'windWavePeriod',
  'swellDirection', 'swellHeight', 'swellPeriod',
  'waveDirection', 'waveHeight', 'wavePeriod',
  'windDirection', 'windSpeed', 'gust',
  'waterTemperature',
].join(',')

const reducer = (accumulator, currentValue) => accumulator + currentValue

const fetchForecast = async (spot) => {
  const timeForecastRequest = Math.floor(Date.now() / 1000)
  // If the request if within 6 hours from the last one I provide the same forecast data
  if ((timeForecastRequest - spot.forecast_last_request) > 21600 || !spot.forecast_last_request) {
    const timeEndForecast = timeForecastRequest + 432000 // 5 days
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
    spot.forecast = arrayWaves.slice(0, 121).filter((el, index) => index % 4 === 0)
  }

  // If the request is older than 5 days from the last one or if there is no tides data present I make a new request
  if ((timeForecastRequest - spot.tides_last_request) > 432000 || !spot.tides_last_request) {
    const tideData = await axios.get(`https://api.stormglass.io/v2/tide/extremes/point?lat=${spot.latitude}&lng=${spot.longitude}`, {
      headers: {
        'Authorization': config.STORMGLASS_API
      }
    })
    spot.tides = tideData.data.data
    spot.tides_last_request = timeForecastRequest
    spot.tile_url = `https://api.maptiler.com/maps/062c0d04-1842-4a45-8181-c5bec3bf2214/static/${spot.longitude},${spot.latitude},13/260x195.png?key=3tFgnOQBQixe61aigsBT&attribution=0`
  }
  spot.forecast_last_request = timeForecastRequest
  await spot.save()
}

module.exports = { fetchForecast }