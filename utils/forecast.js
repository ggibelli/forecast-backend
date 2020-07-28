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

const fetchForecast = async (lat, lon) => {
  const dataJson = await axios.get(`https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=${surfParams}`, {
    headers: {
      'Authorization': config.STORMGLASS_API
    }
  })
  //const parsedData = JSON.stringify(dataJson.data)
  const arrayWaves = dataJson.data.hours.map(hour => {
    const periodObjToArray = hour.swellPeriod !== undefined && Object.values(hour.swellPeriod)
    console.log(objToArray)
    return periodObjToArray && periodObjToArray.reduce(reducer) / periodObjToArray.length
    //console.log(hour.swellPeriod, hour.time)

  })
  console.log(arrayWaves)
}

module.exports = { fetchForecast }