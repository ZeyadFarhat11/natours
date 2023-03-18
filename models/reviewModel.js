const mongoose = require('mongoose');
const Tour = require('./tourModel');
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, "Review conn't be empty!"],
    },
    rating: {
      type: Number,
      required: [true, 'must have rating'],
      max: 5,
      min: 1,
      set: (val) => Math.round(val * 10) / 10,
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!'],
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

reviewSchema.post('save', function () {
  mongoose.models.Review.calcAvgRating(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  const review = await this.findOne();
  if (review) {
    this.tourId = review.tour;
    next();
  } else {
    next();
  }
});
reviewSchema.post(/^findOneAnd/, function () {
  mongoose.models.Review.calcAvgRating(this.tourId);
});

reviewSchema.statics.calcAvgRating = async function (tourId) {
  if (!tourId) return;
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats?.at(0)?.avgRating || 4.5,
    ratingsQuantity: stats?.at(0)?.nRatings || 0,
  });
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
