const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./factory');
exports.getAllReviews = catchAsync(async (req, res) => {
  const { tourId } = req.params;
  const filter = {};
  if (tourId) filter.tour = tourId;
  const reviews = await Review.find(filter).select('-__v').populate();

  res.json({ status: 'success', results: reviews.length, data: { reviews } });
});

exports.getAllReviews = factory.getAll(Review, {
  name: 'reviews',
  getFilterObject: (req) => {
    if (req.params.tourId) return { tour: req.params.tourId };
    return {};
  },
  populate: { path: 'tour', select: 'name' },
});

exports.createReview = catchAsync(async (req, res) => {
  const { review, rating } = req.body;
  const tour = req.params.tourId || req.body.tour;
  const { user } = req;
  const reviewDoc = await Review.create({ user: user._id, review, rating, tour });
  reviewDoc.tour.guides = undefined;
  res.json({ status: 'success', data: { review: reviewDoc } });
});

// exports.checkSameUser = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.params.id);

//   console.log(review);
//   const { user } = req;
//   if (String(user._id) !== String(review.user?._id)) {
//     return next(new AppError("You cann't delete other users reviews!", 401));
//   }
//   next();
// });

exports.updateReview = factory.updateOne(Review, { name: 'review', related: true });
exports.deleteReview = factory.deleteOne(Review);
exports.getReview = factory.getOne(Review, { name: 'review' });
