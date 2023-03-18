const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  deleteTour,
  updateTour,
  getTopFive,
  getTourStates,
  getYearStates,
  getToursWithin,
  getToursDistances,
  uploadTourImages,
  processTourImages,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewsRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewsRouter);

router.route('/top-five').get(getTopFive, getAllTours);
router.route('/year/:year').get(getYearStates);
router.route('/states').get(getTourStates);
router.route('/').get(getAllTours).post(protect, restrictTo('admin', 'lead-guide'), createTour);
router.route('/tours-within').get(getToursWithin);
router.route('/distances').get(getToursDistances);
router
  .route('/:id')
  .get(getTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    processTourImages,
    updateTour
  );

module.exports = router;
