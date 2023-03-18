const mongoose = require('mongoose');

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a tour!'],
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to a user!'],
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bookingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user' }).populate({ path: 'tour', select: 'name' });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
