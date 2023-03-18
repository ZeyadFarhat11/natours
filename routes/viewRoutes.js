const express = require('express');
const {
  getOverview,
  getTour,
  login,
  getAccount,
  getMyBookings,
} = require('../controllers/viewController');
const { isLoggedIn, protect } = require('../controllers/authController');
const { createBookingAfterPay } = require('../controllers/bookingController');

const router = express.Router();

router.get('/account', protect, getAccount);

router.use(isLoggedIn);

router.get('/', createBookingAfterPay, getOverview);
router.get('/tours/:tourSlug', getTour);
router.get('/login', login);
router.get('/my-bookings', protect, getMyBookings);
module.exports = router;
