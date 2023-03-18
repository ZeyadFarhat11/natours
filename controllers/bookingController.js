const stripe = require('stripe')(process.env.STRIPE_SECRET);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    throw new AppError('Invalid tour id!', 400);
  }

  const websiteDomain = `${req.protocol}://${req.get('host')}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`${websiteDomain}/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${websiteDomain}/?tour=${tour._id}&user=${req.user._id}&price=${tour.price}&s=${process.env.BOOKING_SECRET}`,
    cancel_url: `${websiteDomain}/tours/${tour._id}`,
  });

  res.json({ status: 'success', data: { session } });
});

exports.createBookingAfterPay = catchAsync(async (req, res, next) => {
  const { tour, user, price, s } = req.query;
  if (tour && user && price && s === process.env.BOOKING_SECRET) {
    await Booking.create({ user, tour, price });
    res.redirect('/');
  } else {
    next();
  }
});
