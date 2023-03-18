const path = require('path');

const express = require('express');
const morgan = require('morgan');
const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const toursRouter = require('./routes/tourRoutes');
const usersRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/AppError');
const globalErrorController = require('./controllers/errorController');

app.use(helmet());

app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(
  '/api',
  rateLimit({
    max: 150,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests! Please try again later.',
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(compression());

app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      'name',
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
    ],
  })
);

app.use((req, res, next) => {
  res.setHeader(
    'content-security-policy',
    `default-src 'self' https://js.stripe.com ;base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self' https://js.stripe.com ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests`
  );
  next();
});

app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cann't find ${req.originalUrl} route!`));
});

app.use(globalErrorController);

module.exports = app;
