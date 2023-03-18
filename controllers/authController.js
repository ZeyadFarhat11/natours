const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');

const getToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password, passwordChangeDate, role } = req.body;
  const user = await User.create({ name, email, password, passwordChangeDate, role });
  user.password = undefined;

  createSendTokenResponse(user, res, 200);

  const url = `${req.protocol}://${req.get('host')}/account`;
  await new Email(user, url).sendWelcome();
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // console.log({ email, password });
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 401));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }
  createSendTokenResponse(user, res, 200, { sendUser: false });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
  });
  res.json({ status: 'success', data: null });
});

exports.protect = catchAsync(async (req, res, next) => {
  // Check if there is token in headers ✔
  const token = req.headers?.authorization?.replace('Bearer ', '') || req.cookies?.jwt;
  if (!token) {
    return next(new AppError('Please login to get access to this route!', 401));
  }
  // Verificate token ✔
  const JWTDecoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  let user = await User.findById(JWTDecoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token is no longer exist!', 401));
  }
  // Check if user changed password after the token was issued
  if (user.passwordChangedAfter(JWTDecoded.iat)) {
    return next(new AppError('User recently changed password! Please login again.'));
  }

  req.user = user;
  res.locals.user = user;
  next();
});

exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You don't have permission to perform this action!"));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('Invalid email address!'));
  }

  // Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save();

  // Send token to user's email

  try {
    const tokenURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, tokenURL).sendPasswordResetToken();

    res.status(200).json({ status: 'success', message: 'Email sent successfully!' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save();
    return next(new AppError('Failed to send email!', 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on recieved token
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha512').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
  });
  // 2) If token has not expired and there is user : set the new password
  if (!user) {
    return next(new AppError('Invalid token!', 400));
  } else if (user.passwordResetExpiresIn < Date.now()) {
    return next(new AppError('Token has expired!', 400));
  } else if (!req.body.newPassword) {
    return next(new AppError('Please provide newPassword property!', 400));
  }
  user.password = req.body.newPassword;
  // 3) Update changedPasswordAt property for the user
  user.passwordResetToken = undefined;
  user.passwordResetExpiresIn = undefined;
  await user.save();
  // 4) Log the user in : send JWT
  createSendTokenResponse(user, res, 200, { sendUser: false });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');
  // 2) Check if POSTed current password is correct
  const { currentPassword } = req.body;
  const passwordIsCorrent = await user.checkPassword(currentPassword, user.password);
  if (!passwordIsCorrent) {
    return next(new AppError('Current password is invalid!', 400));
  }
  // 3) If so, update password
  const { newPassword } = req.body;
  if (currentPassword === newPassword) {
    return next(new AppError(`Current password mustn't equal the new password!`));
  }
  user.password = newPassword;
  await user.save();
  // 4) Log user in (send JWT)

  createSendTokenResponse(user, res, 200, { sendUser: false });
});

function createSendTokenResponse(user, res, statusCode, { sendUser = true } = {}) {
  const token = getToken(user._id || user.id);

  res.cookie('jwt', token, {
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sucure: process.env.NODE_ENV === 'production',
  });
  res.status(statusCode).json({ status: 'success', token, data: sendUser ? user : undefined });
}

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  const token = req.cookies?.jwt;
  if (!token) return next();

  let JWTDecoded;
  try {
    JWTDecoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    return next();
  }

  let user = await User.findById(JWTDecoded.id);
  if (!user) return next();

  if (user.passwordChangedAfter(JWTDecoded.iat)) return next();

  // console.log({ user });
  res.locals.user = user;
  next();
});
