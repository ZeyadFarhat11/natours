const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./factory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `${req.user._id} - ${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  return cb(new AppError("File isn't image! Please upload an image instead.", 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `${req.user._id} - ${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`./public/img/users/${req.file.filename}`);
  next();
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password) {
    return next(
      new AppError(
        "You cann't update password from this route. You can user /update-password route."
      )
    );
  }

  // 2) Update user profile
  const { user, body } = req;
  const allowedFields = ['name', 'email'];
  for (let field in body) {
    if (allowedFields.includes(field)) {
      user[field] = body[field];
    }
  }
  if (req.file) {
    user.photo = req.file.filename;
  }
  await user.save();
  res.status(200).json({ status: 'success', data: user });
});

exports.deleteProfile = catchAsync(async (req, res, next) => {
  const { user } = req;
  user.active = false;
  await user.save();

  res.status(204).json({ status: 'success', data: null });
});

exports.createUser = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'This route is not implemented yet! Please use /signup instead.',
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};
exports.getAllUsers = factory.getAll(User, { name: 'users' });
exports.getUser = factory.getOne(User, { name: 'user' });
exports.updateUser = factory.updateOne(User, { name: 'user' });
exports.deleteUser = factory.deleteOne(User);
