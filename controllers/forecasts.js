const forecastRouter = require('express').Router();
const SurfSpot = require('../models/surfSpots/surfSpot');

const Forecast = require('../models/forecast');
const forecastHelper = require('../utils/forecastTideFetch');

forecastRouter.get('/:id', async (req, res) => {
  const timeForecastRequest = Math.floor(Date.now() / 1000);
  const forecast = await Forecast.findById(req.params.id)
    .populate('surfspot', { name: 1 })

    .exec();
  if (
    forecast.forecast.length === 0 ||
    timeForecastRequest - forecast.forecastLastRequest > 21600
  ) {
    const spot = await SurfSpot.findById(forecast.surfspot.id).exec();
    await forecastHelper.fetchForecast(spot, forecast);
  }
  res.json(forecast);
});

module.exports = forecastRouter;
