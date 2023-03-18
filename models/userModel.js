const mongoose = require('mongoose');
var validator = require('validator').default;
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const schema = new mongoose.Schema({
  name: {
    required: [true, 'A user must have a name'],
    type: String,
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    validate: [validator.isEmail, 'Email is not valid!'],
    lowercase: true,
  },
  role: { type: String, enum: ['user', 'admin', 'guide', 'lead-guide'], default: 'user' },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    select: false,
  },
  passwordChangeDate: {
    type: Date,
    default: Date.now,
  },
  passwordResetToken: String,
  passwordResetExpiresIn: Date,
  active: { type: Boolean, default: true, select: false },
});

schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

schema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeDate = Date.now() - 1000;
  next();
});

schema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

schema.methods.checkPassword = async function (reqPass, userPass) {
  return await bcrypt.compare(reqPass, userPass);
};
schema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangeDate) {
    const passwordChangeTimestamp = this.passwordChangeDate.getTime() / 1000;
    return JWTTimestamp < passwordChangeTimestamp;
  }
  return false;
};

schema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  const passwordResetTokenHashed = crypto.createHash('sha512').update(resetToken).digest('hex');

  this.passwordResetToken = passwordResetTokenHashed;
  this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000;

  // console.log({ resetToken, hashed: passwordResetTokenHashed });

  return resetToken;
};

const User = mongoose.model('User', schema);

module.exports = User;
