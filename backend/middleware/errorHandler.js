const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('ERROR:', err);

  if (err.name === 'ApiError') {
    return res.status(error.code || 400).json({
      success: false,
      message: error.message || 'Bad Request'
    });
  }

  if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Weather service unavailable'
    });
  }

  if (err.response) {
    if (err.response.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'API key not yet active. New OpenWeatherMap keys can take up to 2 hours to activate.'
      });
    }
    return res.status(err.response.status || 502).json({
      success: false,
      message: err.response.data?.message || 'External API error'
    });
  }

  res.status(error.code || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server Error' : error.message
  });
};

module.exports = errorHandler;
