const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./factory');
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.processTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.getAllTours = factory.getAll(Tour, { name: 'tours' });
exports.getTour = factory.getOne(Tour, { name: 'tour', populate: { path: 'reviews' } });
exports.createTour = factory.createOne(Tour, { name: 'tour' });
exports.updateTour = factory.updateOne(Tour, { name: 'tour' });
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStates = catchAsync(async (req, res) => {
  let states = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgPrice: { $avg: '$price' },
        avgRating: { $avg: '$ratingsAverage' },
        tours: { $sum: 1 },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);
  states = states.map((e) => ({ ...e, avgPrice: Number(e.avgPrice?.toFixed(2)) }));
  res.status(200).json({
    status: 'success',
    data: { states },
  });
});

exports.getYearStates = catchAsync(async (req, res) => {
  const { year } = req.params;

  let states = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        tours: { $push: '$name' },
        numOfTours: { $sum: 1 },
      },
    },
    { $addFields: { monthNumber: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numOfTours: -1 } },
    { $limit: 12 },
  ]);

  states = states.map((state) => ({ ...state, month: MONTHS[state.monthNumber - 1] }));

  const busiestMonth = states.reduce((prev, current) =>
    current.numOfTours > prev.numOfTours ? current : prev
  );
  res.status(200).json({
    status: 'success',
    busiestMonth: busiestMonth.month,
    data: { states },
  });
});

exports.getTopFive = (req, res, next) => {
  req.query = {
    ...req.query,
    limit: 5,
    sort: '-ratingsAverage,price',
    fields: 'name,price,duration,summary,difficulty,ratingsAverage',
  };
  next();
};

// tours-within/400/center/34.111,-118.11/unit/mi
// tours-within?distance=400&latlong=34.111,-118.11&unit=mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlong, unit } = req.query;
  const [lat, long] = latlong.split(',');
  const radius = unit === 'mi' ? distance / 3958.8 : distance / 6378;
  if (!lat || !long) {
    return next(
      new AppError('Please provide latitude and longitude in this form => lat,long', 400)
    );
  } else if (!distance) {
    return next(new AppError('Please provide distance.', 400));
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
  });
  res.status(200).json({ status: 'success', results: tours?.length, data: { tours } });
});

exports.getToursDistances = catchAsync(async (req, res, next) => {
  const { latlong, unit } = req.query;
  const [lat, long] = latlong.split(',');
  if (!lat || !long) {
    return next(
      new AppError('Please provide latitude and longitude in this form => lat,long', 400)
    );
  }
  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [long * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);
  res.status(200).json({ status: 'success', results: tours?.length, data: { tours } });
});
