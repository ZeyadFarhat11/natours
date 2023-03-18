const express = require('express');
const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  getReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/').post(restrictTo('user'), createReview).get(getAllReviews);
router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('admin', 'user'), updateReview)
  .delete(restrictTo('admin', 'user'), deleteReview);
module.exports = router;
