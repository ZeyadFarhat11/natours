const express = require('express');
const {
  getOverview,
  getTour,
  getLogin,
  getSignup,
  getAccount,
  getMyBookings,
  setRedirectUrl,
} = require('../controllers/viewController');
const { isLoggedIn, protect, notLoggedIn } = require('../controllers/authController');
const { createBookingAfterPay } = require('../controllers/bookingController');

const router = express.Router();

router.get('/account', protect, getAccount);

router.use(isLoggedIn);

router.get('/', createBookingAfterPay, getOverview);
router.get('/tours/:tourSlug', getTour);
router.get('/my-bookings', protect, getMyBookings);
router.get('/login', setRedirectUrl, notLoggedIn, getLogin);
router.get('/signup', setRedirectUrl, notLoggedIn, getSignup);

module.exports = router;
