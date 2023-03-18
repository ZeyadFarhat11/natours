const mongoose = require('mongoose');
const validator = require('validator');
const { makeSlug } = require('../utils/utils');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minLength: [10, 'The name must have minimum 10 characters'],
      maxLength: [40, 'The name must have maximum 40 characters'],
      validate: [
        function (val) {
          return validator.isAlpha(val.replace(/\s/g, ''));
        },
        'The tour name must contain characters and spaces only',
      ],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxGroupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'The difficulty must be either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [1, 'RatingsAverage must be greater than 1.00'],
      max: [5, 'RatingsAverage must be smaller than 5.00'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: [
        function (val) {
          return val < this.price;
        },
        'The discount ({VALUE}) must be smaller than tour price',
      ],
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'A tour must have a description'],
      trim: true,
    },
    images: [String],
    startDates: [Date],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    secret: {
      type: Boolean,
      default: false,
      select: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        day: Number,
        description: String,
      },
    ],
    imageCover: String,
    guides: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secret: { $ne: true } });
  this.startTime = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangeDate',
  });
  next();
});

tourSchema.pre('aggregate', function (next) {
  if (JSON.stringify(this.pipeline()[0]).includes('$geoNear')) return next();
  this.pipeline().unshift({ $match: { secret: { $ne: true } } });
  // console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema, 'tours');

module.exports = Tour;
