class AppError extends Error {
  constructor(msg, statusCode = 404) {
    super(msg);
    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOpertional = true;
    this.message = msg;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
