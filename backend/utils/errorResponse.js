class ErrorResponse extends Error {
  constructor(message, code = 400) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

module.exports = ErrorResponse;
