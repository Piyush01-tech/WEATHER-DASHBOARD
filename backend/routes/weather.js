const express = require('express');
const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');
const { get, set } = require('../utils/cache');

const router = express.Router();
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

router.get('/', async (req, res, next) => {
  try {
    const { city, units = 'metric' } = req.query;

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new ErrorResponse('City parameter is required', 400);
    }

    const cacheKey = `weather:${city.trim().toLowerCase()}:${units}`;

    let weatherData = get(cacheKey);
    if (weatherData) {
      return res.json({ success: true, cached: true, data: weatherData });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new ErrorResponse('API key not configured', 500);

    const response = await axios.get(BASE_URL, {
      params: { q: city.trim(), appid: apiKey, units, lang: 'en' },
      timeout: 10000
    });

    const apiData = response.data;

    if (apiData.cod !== 200) {
      throw new ErrorResponse(apiData.message || 'City not found', 404);
    }

    weatherData = {
      city: apiData.name,
      country: apiData.sys.country,
      lat: apiData.coord.lat,
      lon: apiData.coord.lon,
      temp: Math.round(apiData.main.temp),
      feels_like: Math.round(apiData.main.feels_like),
      description: apiData.weather[0].description,
      icon: apiData.weather[0].icon,
      humidity: apiData.main.humidity,
      wind_speed: apiData.wind.speed,
      sunrise: new Date(apiData.sys.sunrise * 1000).toISOString(),
      sunset: new Date(apiData.sys.sunset * 1000).toISOString(),
      last_updated: new Date().toISOString()
    };

    set(cacheKey, weatherData);

    res.json({ success: true, cached: false, data: weatherData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
