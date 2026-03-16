const express = require('express');
const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');
const { get, set } = require('../utils/cache');

const router = express.Router();
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

router.get('/', async (req, res, next) => {
  try {
    const { city, units = 'metric' } = req.query;

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new ErrorResponse('City parameter is required', 400);
    }

    const cacheKey = `forecast:${city.trim().toLowerCase()}:${units}`;

    let forecastData = get(cacheKey);
    if (forecastData) {
      return res.json({ success: true, cached: true, data: forecastData });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new ErrorResponse('API key not configured', 500);

    const response = await axios.get(BASE_URL, {
      params: { q: city.trim(), appid: apiKey, units, lang: 'en' },
      timeout: 10000
    });

    const apiData = response.data;

    if (apiData.cod !== '200') {
      throw new ErrorResponse(apiData.message || 'Forecast not available', 404);
    }

    const dailyList = apiData.list.filter((_, i) => i % 8 === 0).slice(0, 5);

    forecastData = dailyList.map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      }),
      icon: item.weather[0].icon,
      description: item.weather[0].main,
      temp: Math.round(item.main.temp),
      humidity: item.main.humidity,
      wind_speed: item.wind.speed,
      dt: item.dt * 1000
    }));

    set(cacheKey, forecastData);

    res.json({ success: true, cached: false, data: forecastData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
