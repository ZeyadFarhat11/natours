const AppError = require('../utils/AppError');

function sendErrorDev(err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode || 500).json({
      status: err.status || 'fail',
      error: err,
      statusCode: err.statusCode,
      stack: err.stack,
      message: err.message,
    });
  }

  return res.status(200).render('error', { msg: err.message });
}
function sendErrorProd(err, req, res) {
  if (err.isOpertional) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(err.statusCode || 500).json({
        status: err.status || 'fail',
        message: err.message,
      });
    }
    return res.status(200).render('error', { msg: err.message });
  } else {
    console.error(`Error 💥`, err);

    if (req.originalUrl.startsWith('/api')) {
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }

    return res.status(200).render('error', { msg: 'Something went wrong! Try again later.' });
  }
}
function handleCastError(err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}
function handleDuplicateField(err) {
  const value = err.errmsg.match(/(["']).+\1/)[0];
  const message = `Duplicate field value ${value}. Please use another value!`;
  return new AppError(message, 400);
}
function handleValidationError(err) {
  const errorsString = Object.values(err.errors).map((e) => e.message);
  const message = `Invalid input date. ${errorsString.join('. ')}.`;

  return new AppError(message, 400);
}
function handleJWTError() {
  return new AppError('Invalid token! Please login again.', 401);
}
function handleJWTExpireError() {
  return new AppError('Your token has expired! Please login again.', 401);
}
module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastError(err);
    if (err.code === 11000) err = handleDuplicateField(err);
    if (err.name === 'ValidationError') err = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpireError();
    sendErrorProd(err, req, res);
  }
};
