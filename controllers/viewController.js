const { promisify } = require('util');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  res.render('overview', { tours });
});
exports.getTour = catchAsync(async (req, res) => {
  const { tourSlug } = req.params;
  const tour = await Tour.findOne({ slug: tourSlug }).populate({
    path: 'reviews',
  });

  if (!tour) {
    throw new AppError('This is no tour with that name.', 404);
  }

  res.render('tour', { tour, title: tour.name });
});

exports.login = (req, res) => {
  if (res.locals.user) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Login' });
};

exports.getAccount = (req, res) => {
  res.render('account', { title: 'Account' });
};

exports.getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id });
  const tours = await Tour.find({ _id: { $in: bookings.map((e) => e.tour._id) } });

  if (tours.length) {
    res.render('overview', {
      title: 'My Bookings',
      tours,
    });
  } else {
    res.redirect('/');
  }
});
